const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');  

const app = express();
const PORT = 3000;
const filePath = path.join(__dirname, "data.json");

app.use(cors());

app.use(express.json()); 

function readDataFromFile() {
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } else {
    return [];
  }
}

function writeDataToFile(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

app.get('/get/:id', (req, res) => {
  const id = req.params.id;
  
  try {
    const data = readDataFromFile();
    const item = data.find((item) => item.id === id);
    
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ message: 'Elemento no encontrado' });
    }
  } catch (error) {
    console.error('Error al leer datos:', error.message);
    res.status(500).json({ message: 'Error al procesar la solicitud' });
  }
});

app.post('/save', (req, res) => {
  const dataArray = Array.isArray(req.body) ? req.body : [req.body];
  
  dataArray.forEach(item => {
    if (typeof item.id === 'undefined' || typeof item.arrivalTime === 'undefined') {
      return res.status(400).send('Cada objeto debe tener un ID y una hora de llegada.');
    }
  });

  let existingData = readDataFromFile();
  
  dataArray.forEach(data => {
    const existingItem = existingData.find(item => item.id === data.id);
    if (existingItem) {
      return res.status(400).send(`El ID ${data.id} ya existe. Intenta con otro ID.`);
    }
    const arrivalTime = new Date().toISOString();
    const newData = { ...data, arrivalTime: arrivalTime };
    existingData.push(newData);
  });

  writeDataToFile(existingData);
  res.send('Datos guardados correctamente.');
});

app.patch('/update/:id', (req, res) => {
  const id = req.params.id;
  const updates = req.body;

  if (typeof updates !== 'object' || Array.isArray(updates)) {
    return res.status(400).json({ message: 'El cuerpo de la solicitud debe ser un objeto' });
  }

  if (updates.hasOwnProperty('id')) {
    return res.status(400).json({ message: 'No se puede modificar el campo id' });
  }

  let existingData = readDataFromFile();
  const itemIndex = existingData.findIndex((item) => item.id === id);
  if (itemIndex === -1) {
    return res.status(404).json({ message: 'Elemento no encontrado' });
  }
  const updatedItem = { ...existingData[itemIndex], ...updates };
  existingData[itemIndex] = updatedItem;

  writeDataToFile(existingData);
  res.json(updatedItem);
});

app.delete('/delete/:id', (req, res) => {
  const id = req.params.id;
  let data = readDataFromFile();
  const newData = data.filter((item) => item.id !== id);

  if (data.length === newData.length) {
    return res.status(404).json({ message: 'Elemento no encontrado' });
  }

  writeDataToFile(newData);
  res.json({ message: 'Elemento eliminado correctamente' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
