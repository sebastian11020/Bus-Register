const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;


const filePath = path.join(__dirname,"data.json");

function readDataFromFile(){
  const data = fs.readFileSync(filePath,'utf8');
  return JSON.parse(data);
}

app.get('/get-bus/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const data = readDataFromFile;
  const item = data.find((item) => item.id === id);
  if(item){
    res.json(item);
  }else{
    res.status(404).json({message: 'Elemento no encontrado'})
  }
});

app.post('/save-data', (req, res) => {
  let body = '';

  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      
      const filePath = path.join(__dirname, 'data.json');
      
      let existingData = [];
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath);
        existingData = JSON.parse(fileContent);
      }

      existingData.push(data);
      
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
      
      res.send('Datos guardados correctamente.');
    } catch (error) {
      res.status(400).send('Error al procesar datos.');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
