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
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const data = fileContent.trim() ? JSON.parse(fileContent) : [];
      console.log('Datos leídos del archivo:', data);
      return data;
    } catch (error) {
      console.error('Error al leer el archivo JSON:', error.message);
      return []; 
    }
  } else {
    console.warn('El archivo JSON no existe.');
    return [];
  }
}

function writeDataToFile(data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log('Datos escritos en el archivo:', data);
  } catch (error) {
    console.error('Error al escribir en el archivo JSON:', error.message);
  }
}

app.get('/get/:id', (req, res) => {
  const id = req.params.id;
  console.log(`Solicitud GET recibida para ID: ${id}`);

  try {
    const data = readDataFromFile();
    const item = data.find((item) => item.id === id);
    
    if (item) {
      console.log(`Elemento encontrado: ${JSON.stringify(item)}`);
      res.json(item);
    } else {
      console.warn(`Elemento con ID ${id} no encontrado`);
      res.status(404).json({ message: 'Elemento no encontrado' });
    }
  } catch (error) {
    console.error('Error al leer datos:', error.message);
    res.status(500).json({ message: 'Error al procesar la solicitud' });
  }
});

app.post('/save', (req, res) => {
  console.log('Solicitud POST recibida para guardar datos:', req.body);
  const dataArray = Array.isArray(req.body) ? req.body : [req.body];

  for (const item of dataArray) {
    if (typeof item.id === 'undefined' || typeof item.arrivalTime === 'undefined') {
      console.warn('Solicitud incorrecta. Cada objeto debe tener un ID y una hora de llegada.');
      return res.status(400).send('Cada objeto debe tener un ID y una hora de llegada.');
    }
  }

  let existingData = readDataFromFile();
  
  for (const data of dataArray) {
    const existingItem = existingData.find(item => item.id === data.id);
    if (existingItem) {
      console.warn(`El ID ${data.id} ya existe.`);
      return res.status(400).send(`El ID ${data.id} ya existe. Intenta con otro ID.`);
    }
  }

  for (const data of dataArray) {
    const arrivalTime = new Date().toISOString();
    const newData = { ...data, arrivalTime: arrivalTime, modificationCount: 0 }; 
    existingData.push(newData);
  }

  writeDataToFile(existingData);
  console.log('Datos guardados correctamente.');
  res.send('Datos guardados correctamente.');
});

app.patch('/update/:id', (req, res) => {
  const id = req.params.id;
  const updates = req.body;
  console.log(`Solicitud PATCH recibida para ID: ${id} con actualizaciones:`, updates);

  if (typeof updates !== 'object' || Array.isArray(updates)) {
    console.warn('El cuerpo de la solicitud debe ser un objeto');
    return res.status(400).json({ message: 'El cuerpo de la solicitud debe ser un objeto' });
  }

  if (updates.hasOwnProperty('id')) {
    console.warn('No se puede modificar el campo id');
    return res.status(400).json({ message: 'No se puede modificar el campo id' });
  }

  let existingData = readDataFromFile();
  const itemIndex = existingData.findIndex((item) => item.id === id);
  if (itemIndex === -1) {
    console.warn(`Elemento con ID ${id} no encontrado`);
    return res.status(404).json({ message: 'Elemento no encontrado' });
  }
  existingData[itemIndex].modificationCount = (existingData[itemIndex].modificationCount || 0) + 1;

  const updatedItem = { ...existingData[itemIndex], ...updates };
  existingData[itemIndex] = updatedItem;

  writeDataToFile(existingData);
  console.log(`Elemento actualizado: ${JSON.stringify(updatedItem)}`);
  res.json(updatedItem);
});

app.delete('/delete/:id', (req, res) => {
  const id = req.params.id;
  console.log(`Solicitud DELETE recibida para ID: ${id}`);
  let data = readDataFromFile();
  const newData = data.filter((item) => item.id !== id);

  if (data.length === newData.length) {
    console.warn(`Elemento con ID ${id} no encontrado`);
    return res.status(404).json({ message: 'Elemento no encontrado' });
  }

  writeDataToFile(newData);
  console.log(`Elemento con ID ${id} eliminado`);
  res.json({ message: 'Elemento eliminado correctamente' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
