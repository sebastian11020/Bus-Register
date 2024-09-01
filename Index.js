const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;


const filePath = path.join(__dirname,"data.json");

function readDataFromFile() {
  const filePath = path.join(__dirname, 'data.json');
  
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
  const id = parseInt(req.params.id);
  
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
  let body = '';

  req.on('data', chunk => {
    body += chunk.toString(); 
  });

  req.on('end', () => {
    console.log('Cuerpo de la solicitud recibido:', body);

    try {
      const data = JSON.parse(body);
      console.log('Datos convertidos a JSON:', data);

      const dataArray = Array.isArray(data) ? data : [data];

      dataArray.forEach(item => {
        if (typeof item.id === 'undefined' || typeof item.arrivalTime === 'undefined') {
          throw new Error('Cada objeto debe tener un ID y una hora de llegada.');
        }
      });

      const filePath = path.join(__dirname, 'data.json');
      
      let existingData = [];
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        if (fileContent.trim() === '') {
          existingData = [];
        } else {
          existingData = JSON.parse(fileContent);
        }
        console.log('Contenido del archivo existente:', existingData);
      }

      dataArray.forEach(data => {
        const existingItem = existingData.find(item => item.id === data.id);
        if (existingItem) {
          return res.status(400).send(`El ID ${data.id} ya existe. Intenta con otro ID.`);
        }
        const arrivalTime = new Date().toISOString();
        const newData = {
          ...data,
          arrivalTime: arrivalTime
        };
        existingData.push(newData);
      });

      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
      
      res.send('Datos guardados correctamente.');
    } catch (error) {
      console.error('Error al procesar datos:', error.message);
      res.status(400).send(`Error al procesar datos: ${error.message}`);
    }
  });
});

app.patch('/update/:id', (req, res) => {
  const id = parseInt(req.params.id); 
  let body = '';

  req.on('data', chunk => {
    body += chunk.toString(); 
  });

  req.on('end', () => {
    try {
      const updates = JSON.parse(body); 

      if (typeof updates !== 'object' || Array.isArray(updates)) {
        return res.status(400).json({ message: 'El cuerpo de la solicitud debe ser un objeto' });
      }

      if (updates.hasOwnProperty('id')) {
        return res.status(400).json({ message: 'No se puede modificar el campo id' });
      }

      const { id: _, ...updateFields } = updates;

      const filePath = path.join(__dirname, 'data.json');
      let existingData = [];

      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        existingData = JSON.parse(fileContent);
      }

      const itemIndex = existingData.findIndex((item) => item.id === id);
      if (itemIndex === -1) {
        return res.status(404).json({ message: 'Elemento no encontrado' });
      }
      const updatedItem = { ...existingData[itemIndex], ...updateFields };
      existingData[itemIndex] = updatedItem;

      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

      res.json(updatedItem);
    } catch (error) {
      console.error('Error al actualizar datos:', error.message);
      res.status(500).json({ message: 'Error al procesar la solicitud' });
    }
  });
});

app.delete('/delete/:id', (req, res) => {
  const id = parseInt(req.params.id);
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
