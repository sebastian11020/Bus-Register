const express = require('express');
const app = express();
const PORT = 3000;


app.get('/', (req, res) => {
  res.send('¡Hola, Express!');
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
