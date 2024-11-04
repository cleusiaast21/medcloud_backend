from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load your trained models
models = {
    'D_AIDS': joblib.load('./modelsPython/model_D_AIDS.pkl'),
    'D_Alergia': joblib.load('./modelsPython/model_D_Alergia.pkl'),
    'D_Asma Brônquica': joblib.load('./modelsPython/model_D_Asma Brônquica.pkl'),
    'D_Varicela': joblib.load('./modelsPython/model_D_Varicela.pkl'),
    'D_Gripe': joblib.load('./modelsPython/model_D_Gripe.pkl'),
    'D_Diabetes': joblib.load('./modelsPython/model_D_Diabetes.pkl'),
    'D_Reação a Medicamentos': joblib.load('./modelsPython/model_D_Reação a Medicamentos.pkl'),
    'D_Hepatite B': joblib.load('./modelsPython/model_D_Hepatite B.pkl'),
    'D_Hepatite C': joblib.load('./modelsPython/model_D_Hepatite C.pkl'),
    'D_Hepatite D': joblib.load('./modelsPython/model_D_Hepatite D.pkl'),
    'D_Hepatite E': joblib.load('./modelsPython/model_D_Hepatite E.pkl'),
    'D_Hipertensão': joblib.load('./modelsPython/model_D_Hipertensão.pkl'),
    'D_Hipoglicemia': joblib.load('./modelsPython/model_D_Hipoglicemia.pkl'),
    'D_Malária': joblib.load('./modelsPython/model_D_Malária.pkl'),
    'D_Enxaqueca': joblib.load('./modelsPython/model_D_Enxaqueca.pkl'),
    'D_Pneumonia': joblib.load('./modelsPython/model_D_Pneumonia.pkl'),
    'D_Tuberculose': joblib.load('./modelsPython/model_D_Tuberculose.pkl'),
    'D_Febre Tifoide': joblib.load('./modelsPython/model_D_Febre Tifoide.pkl'),
    'D_Hepatite A': joblib.load('./modelsPython/model_D_Hepatite A.pkl')
}

feature_names = [
    'coceira', 'erupção cutânea', 'espirros contínuos', 'tremores', 'calafrios', 'dor nas articulações',
    'dor de estómago', 'acidez', 'desgaste muscular', 'vómito', 'fadiga', 'ganho de peso', 'ansiedade',
    'mãos e pés frios', 'alterações de humor', 'perda de peso', 'inquietação', 'letargia', 'manchas na garganta',
    'tosse', 'febre alta', 'falta de ar', 'sudorese', 'indigestão', 'dor de cabeça', 'pele amarelada',
    'urina escura', 'náusea', 'perda de apetite', 'constipação', 'dor abdominal', 'diarreia', 'febre leve',
    'urina amarelada', 'amarelamento dos olhos', 'irritação na garganta', 'vermelhidão nos olhos', 'nariz escorrendo',
    'dor no peito', 'batimento cardíaco rápido', 'tontura', 'obesidade', 'rosto e olhos inchados',
    'fome excessiva', 'secura e formigamento nos lábios', 'fala arrastada', 'fraqueza muscular', 'rigidez no pescoço',
    'perda de equilíbrio', 'fraqueza de um lado do corpo', 'perda de olfato', 'dor muscular',
    'manchas vermelhas no corpo', 'dor na barriga', 'lacrimejamento', 'aumento de apetite', 'falta de concentração',
    'histórico de consumo de álcool', 'sangue no escarro'
]

@app.route('/predict', methods=['POST'])
def predict():
    symptoms = request.json.get('symptoms', [])
    print(f"Received symptoms: {symptoms}")

    # Initialize a DataFrame with all feature names, set to 0
    input_data = pd.DataFrame(0, index=[0], columns=feature_names)
    # Log alla feature names to ensure they are correctly set
    print(f"Feature names in input DataFrame: {input_data.columns.tolist()}")

    # Set features to 1 if they are present
    for symptom in symptoms:
        if symptom in input_data.columns:
            input_data[symptom] = 1
        else:
            print(f"Warning: Symptom '{symptom}' not found in feature names.")

    # Log the DataFrame after setting symptom values
    print(f"Input data for prediction:\n{input_data}")

    # Make predictions
    predictions = {}
    for disease, model in models.items():
        try:
            # Predict and capture prediction
            prediction = model.predict(input_data)[0]
            predictions[disease] = int(prediction)
            print(f"Prediction for {disease}: {prediction}")
        except Exception as e:
            predictions[disease] = f"Error predicting {disease}: {str(e)}"
            print(f"Error predicting {disease}: {str(e)}")

    return jsonify(predictions)

if __name__ == '__main__':
    app.run(port=5001,debug=True)
