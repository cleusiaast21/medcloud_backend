import pandas as pd
from sklearn.model_selection import train_test_split
import pickle
import os
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import StandardScaler

# Carregar o dataset
df = pd.read_csv('./dataset.csv')

# Separar as colunas de sintomas e doenças
symptom_columns = [col for col in df.columns if not col.startswith('D_')]
disease_columns = [col for col in df.columns if col.startswith('D_')]

# Criar e salvar um modelo para cada doença
for disease in disease_columns:
    X = df[symptom_columns]  # sintomas como atributos
    y = df[disease]          # target é a doença específica
    
    # Dividir o dataset em conjunto de treino e conjunto de teste
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Normalizar os dados
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)

    # Treinar o modelo usando o KNN, com 10 vizinhos
    model = KNeighborsClassifier(n_neighbors=10)
    model.fit(X_train, y_train)
    
    # Calcular a acurácia no conjunto de teste
    accuracy = model.score(X_test, y_test)
    print(f'Accuracy for {disease}: {accuracy:.2f}')
    
    directory = 'modelsPython'
    filename = f'model_{disease}.pkl'
    file_path = os.path.join(directory, filename)

    # Criar o directório se não existir
    if not os.path.exists(directory):
        os.makedirs(directory)

    # Salvar o modelo para o directório especificado
    with open(file_path, 'wb') as file:
        pickle.dump(model, file)
        