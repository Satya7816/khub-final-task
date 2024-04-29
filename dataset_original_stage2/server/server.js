const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const mongoose = require('mongoose');
const fs = require('fs');
const csvParser = require('csv-parser');

const app = express();
const PORT = process.env.PORT || 5001;

mongoose.set('strictQuery', true);
mongoose.connect('mongodb+srv://satyabalajianimireddy:2211@cluster1.xbd6fhk.mongodb.net/luploadedFiles')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log(err));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

const fileSchema = new mongoose.Schema({
  filename: String,
  data: [{ }] // Using a flexible schema for data
});

const FileModel = mongoose.model('File', fileSchema);

const upload = multer({ dest: 'uploads/' });

// Handle CSV and XLSX file uploads
app.post('/csv-upload', upload.single('file'), async (req, res) => {
  const filename = req.file.originalname;
  const ext = filename.split('.').pop().toLowerCase();

  try {
    let results = [];
    if (ext === 'csv') {
      // Parse CSV
      results = await parseCSV(req.file.path);
    } else if (ext === 'xlsx') {
      // Parse XLSX
      results = await parseXLSX(req.file.path);
    } else {
      throw new Error('Unsupported file format');
    }

    // Save to MongoDB
    const newFile = new FileModel({
      filename,
      data: results
    });
    await newFile.save();

    // Fetch all filenames and ids from MongoDB and send as response
    const files = await FileModel.find({}, '_id filename');
    res.status(200).json(files.map(file => ({ _id: file._id, filename: file.filename })));
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Parse CSV file
async function parseCSV(filePath) {
  const results = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// Parse XLSX file
async function parseXLSX(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0]; // Assuming only one sheet
  const worksheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(worksheet, { raw: true });
}

app.get('/data/:id', async (req, res) => {
  const fileId = req.params.id;
  try {
    const data = await FileModel.findById(fileId);
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log('Server is running on port ${PORT}');
});