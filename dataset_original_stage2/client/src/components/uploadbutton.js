import React, { useState, useEffect } from 'react';
import './uploadbutton.css';

const UploadButton = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedDatasets, setUploadedDatasets] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [recordsPerPage, setRecordsPerPage] = useState(50); // Default records per page

  useEffect(() => {
    // Example: Fetching data for the first dataset on component mount
    if (uploadedDatasets.length > 0) {
      handleDatasetClick(uploadedDatasets[0]._id);
    }
  }, [uploadedDatasets]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileType = file.name.split('.').pop();
      if (fileType === 'xlsx' || fileType === 'csv') {
        setSelectedFile(file);
        setErrorMessage('');
      } else {
        setSelectedFile(null);
        setErrorMessage('Please choose a dataset in Excel or CSV format.');
      }
    }
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
      const response = await fetch('http://localhost:5001/csv-upload', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error('Upload failed');
      }
  
      const filenames = await response.json();
      setUploadedDatasets(filenames);
    } catch (error) {
      console.error(error);
      console.log(error.message);
    }
  };
  
  const handleDatasetClick = async (id) => {
    try {
      const res = await fetch(`http://localhost:5001/data/${id}`);
      if (res.ok) {
        const fileData = await res.json();
        setSelectedDataset(fileData);
      }
    } catch (error) {
      console.log(error)
    }
  };

  const handleRecordsPerPageChange = (event) => {
    const value = parseInt(event.target.value);
    setRecordsPerPage(value);
  };
  
  return (
    <div className="upload-container">
      <div className="file-upload-container">
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={!selectedFile}>
          Upload
        </button>
      </div>
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      {uploadedDatasets.length > 0 && (
        <div className="datasets-container">
          <h3>Uploaded Datasets:</h3>
          <ul>
            {uploadedDatasets.map((dataset) => (
              <li key={dataset._id} onClick={() => handleDatasetClick(dataset._id)}>
                {dataset.filename}
              </li>
            ))}
          </ul>
        </div>
      )}
      {selectedDataset && (
        <div>
          <div className="records-per-page">
            <label>Records per page:</label>
            <select value={recordsPerPage} onChange={handleRecordsPerPageChange}>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="150">150</option>
              <option value="200">200</option>
              <option value="all">All</option>
            </select>
          </div>
          <div className="data-container">
            <h3>Data for {selectedDataset.filename}:</h3>
            <table>
              <thead>
                <tr>
                  {Object.keys(selectedDataset.data[0]).map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recordsPerPage === 'all' ? (
                  selectedDataset.data.map((item, index) => (
                    <tr key={index}>
                      {Object.values(item).map((value, i) => (
                        <td key={i}>{value}</td>
                      ))}
                    </tr>
                  ))
                ) : (
                  selectedDataset.data.slice(0, recordsPerPage).map((item, index) => (
                    <tr key={index}>
                      {Object.values(item).map((value, i) => (
                        <td key={i}>{value}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadButton;
