import pandas as pd
from sklearn.model_selection import train_test_split
import pickle
import os
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import StandardScaler

# Load your dataset
df = pd.read_csv('./dataset.csv')

# Separate symptom and disease columns
symptom_columns = [col for col in df.columns if not col.startswith('D_')]
disease_columns = [col for col in df.columns if col.startswith('D_')]

# Create and save a model for each disease
for disease in disease_columns:
    X = df[symptom_columns]  # symptoms as features
    y = df[disease]          # target is the specific disease
    
    # Split the data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Normalizar os dados
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)

    # Train the model using RandomForestClassifier
    model = KNeighborsClassifier(n_neighbors=10)
    model.fit(X_train, y_train)
    
    # Calculate accuracy on the test set
    accuracy = model.score(X_test, y_test)
    print(f'Accuracy for {disease}: {accuracy:.2f}')
    
    directory = 'modelsPython'
    filename = f'model_{disease}.pkl'
    file_path = os.path.join(directory, filename)

    # Create the directory if it doesn't exist
    if not os.path.exists(directory):
        os.makedirs(directory)

    # Save the model to the specified path
    with open(file_path, 'wb') as file:
        pickle.dump(model, file)
        