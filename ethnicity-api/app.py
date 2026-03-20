from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace
import cv2
import numpy as np
from PIL import Image
import io
import base64
import os
import uuid
import hashlib

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js frontend

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'ethnicity-detection-api'})

@app.route('/analyze-ethnicity', methods=['POST'])
def analyze_ethnicity():
    try:
        # Get image data from request
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Decode base64 image
        image_data = data['image']
        if image_data.startswith('data:image'):
            # Remove data URL prefix if present
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        
        # Create unique temp file name to avoid conflicts between concurrent requests
        # Use hash of image data to verify we're processing different images
        image_hash = hashlib.md5(image_bytes).hexdigest()[:8]
        unique_id = str(uuid.uuid4())[:8]
        temp_path = f'/tmp/temp_face_{unique_id}_{image_hash}.jpg'
        
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert PIL Image to numpy array (RGB)
        img_array = np.array(image)
        
        # Convert RGB to BGR for OpenCV
        img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        
        # Log image info for debugging
        print(f"Processing image: {temp_path}, size: {img_bgr.shape}, hash: {image_hash}, bytes: {len(image_bytes)}")
        
        # Validate image dimensions
        if img_bgr.shape[0] < 50 or img_bgr.shape[1] < 50:
            return jsonify({
                'success': False,
                'error': 'Image too small for face detection',
                'details': f'Image size: {img_bgr.shape[1]}x{img_bgr.shape[0]} (minimum: 50x50)'
            }), 400
        
        # Validate image data is not empty/corrupted
        if len(image_bytes) < 1000:  # Very small images are likely corrupted
            return jsonify({
                'success': False,
                'error': 'Image data too small or corrupted',
                'details': f'Image bytes: {len(image_bytes)} (expected > 1000 bytes)'
            }), 400
        
        # Check if image is mostly black/empty
        mean_pixel = np.mean(img_bgr)
        if mean_pixel < 5:  # Image is mostly black
            return jsonify({
                'success': False,
                'error': 'Image appears to be empty or black',
                'details': f'Mean pixel value: {mean_pixel:.2f}'
            }), 400
        
        cv2.imwrite(temp_path, img_bgr)
        
        # Verify image was saved correctly
        saved_size = os.path.getsize(temp_path) if os.path.exists(temp_path) else 0
        if not os.path.exists(temp_path) or saved_size == 0:
            return jsonify({
                'success': False,
                'error': 'Failed to save image file',
                'details': f'Saved size: {saved_size} bytes'
            }), 400
        
        print(f"✓ Image saved successfully: {saved_size} bytes")
        
        try:
            # Simple DeepFace analysis - just use default settings
            print("Running DeepFace analysis...")
            result = DeepFace.analyze(
                img_path=temp_path,
                actions=['race'],
                enforce_detection=False,
                silent=True
            )
            print("✓ DeepFace analysis successful")
            
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
            
            # Extract race/ethnicity information
            if isinstance(result, list):
                result = result[0]  # Take first result if multiple faces
            
            race_data = result.get('race', {})
            
            # Log raw data for debugging - include image hash to verify different images
            print(f"\n{'='*60}")
            print(f"Image Analysis Results:")
            print(f"  Image hash: {image_hash}")
            print(f"  Image size: {img_bgr.shape}")
            print(f"  DeepFace raw race data: {race_data}")
            if race_data:
                sorted_races = sorted(race_data.items(), key=lambda x: x[1], reverse=True)
                print(f"  Top predictions:")
                for race, conf in sorted_races[:3]:
                    print(f"    - {race}: {conf:.2f}%")
            print(f"{'='*60}\n")
            
            # Validate that we have race data
            if not race_data or len(race_data) == 0:
                return jsonify({
                    'success': False,
                    'error': 'No race data returned from DeepFace',
                    'raw_result': result
                }), 400
            
            # DeepFace returns race data as dictionary with percentages (0-100)
            # According to documentation: https://sefiks.com/2019/11/11/race-and-ethnicity-prediction-in-keras/
            # The model uses FairFace dataset with 6 categories
            # Values are typically percentages, normalize to 0-1 for consistency
            normalized_race_data = {}
            for race, value in race_data.items():
                if isinstance(value, (int, float)):
                    # DeepFace returns percentages (0-100), convert to probability (0-1)
                    if value > 1:
                        normalized_race_data[race] = value / 100.0
                    else:
                        normalized_race_data[race] = value
                else:
                    normalized_race_data[race] = 0.0
            
            # Get dominant race (highest confidence)
            # Note: Model has ~68% accuracy as documented, so results may not always be perfect
            if not normalized_race_data:
                return jsonify({
                    'success': False,
                    'error': 'Could not normalize race data',
                    'raw_result': result
                }), 400
            
            dominant_race = max(normalized_race_data.items(), key=lambda x: x[1])[0]
            max_confidence = normalized_race_data[dominant_race]
            
            # Return DeepFace result exactly as it provides
            # Model accuracy is ~68% as documented, so all predictions are included
            return jsonify({
                'success': True,
                'ethnicity': {
                    'dominant': dominant_race,
                    'predictions': normalized_race_data,
                    'confidence': max_confidence
                },
                'raw_result': result
            })
            
        except Exception as e:
            # Clean up temp file on error
            if os.path.exists(temp_path):
                os.remove(temp_path)
            
            return jsonify({
                'success': False,
                'error': f'DeepFace analysis failed: {str(e)}',
                'message': 'Could not detect face or analyze ethnicity'
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/analyze-all-attributes', methods=['POST'])
def analyze_all_attributes():
    """Analyze all face attributes including ethnicity, age, gender, emotion"""
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400
        
        image_data = data['image']
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        img_array = np.array(image)
        img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        
        # Use unique temp file
        image_hash = hashlib.md5(image_bytes).hexdigest()[:8]
        unique_id = str(uuid.uuid4())[:8]
        temp_path = f'/tmp/temp_face_all_{unique_id}_{image_hash}.jpg'
        cv2.imwrite(temp_path, img_bgr)
        
        try:
            # Use best detector backend
            detector_backends = ['retinaface', 'mtcnn', 'opencv']
            result = None
            last_error = None
            
            for backend in detector_backends:
                try:
                    result = DeepFace.analyze(
                        img_path=temp_path,
                        actions=['age', 'gender', 'race', 'emotion'],
                        enforce_detection=False,
                        silent=False,
                        detector_backend=backend,
                        prog_bar=False
                    )
                    break
                except Exception as e:
                    last_error = e
                    continue
            
            if result is None:
                raise Exception(f"All detector backends failed. Last error: {str(last_error)}")
            
            if os.path.exists(temp_path):
                os.remove(temp_path)
            
            if isinstance(result, list):
                result = result[0]
            
            race_data = result.get('race', {})
            dominant_race = max(race_data.items(), key=lambda x: x[1])[0] if race_data else 'unknown'
            
            return jsonify({
                'success': True,
                'ethnicity': {
                    'dominant': dominant_race,
                    'predictions': race_data,
                    'confidence': max(race_data.values()) if race_data else 0
                },
                'age': result.get('age', 0),
                'gender': result.get('dominant_gender', 'unknown'),
                'emotion': result.get('dominant_emotion', 'unknown'),
                'raw_result': result
            })
            
        except Exception as e:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return jsonify({
                'success': False,
                'error': f'Analysis failed: {str(e)}'
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)

