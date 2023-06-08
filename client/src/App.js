import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const chunkSize = 20 * 1024 * 1024; //20 Mb sprate chunk

const App = () => {
  const [dropzoneActive, setDropzoneActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(null);
  const [lastUploadedFileIndex, setLastUploadedFileIndex] = useState(null);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setFiles([...files, ...e.dataTransfer.files]);
  };

  console.log("file is ", files);
  const readAndUploadCurrentChunk = () => {
    const reader = new FileReader();
    const file = files[currentFileIndex];
    if (!file) {
      return;
    }
    const from = currentChunkIndex * chunkSize; // start from 0
    const to = from + chunkSize;
    const chunkBlock = file.slice(from, to);
    reader.onload = (e) => uploadChunk(e);
    reader.readAsDataURL(chunkBlock);
  };

  const uploadChunk = (readerEvent) => {
    const file = files[currentFileIndex];
    const data = readerEvent.target.result;
    const params = new URLSearchParams();
    params.set("name", file.name);
    params.set("size", file.size);
    params.set("currentChunkIndex", currentChunkIndex);
    params.set("totalChunks", Math.ceil(file.size / chunkSize));
    const headers = { "Content-Type": "application/octet-stream" };
    const url = "http://localhost:8000/upload?" + params.toString();
    // sending data to backend
    axios.post(url, data, { headers }).then((response) => {
      console.log("url is", url);
      console.log("data is", data);
      console.log("header is", headers);

      const filesize = files[currentFileIndex].size;
      console.log("file size is", filesize);
      const chunks = Math.ceil(filesize / chunkSize) - 1;
      const isLastChunk = currentChunkIndex === chunks;
      console.log(" chunk is", currentChunkIndex);
      if (isLastChunk) {
        file.finalFilename = response.data.finalFilename;
        setLastUploadedFileIndex(currentFileIndex);
        setCurrentChunkIndex(null);
      } else {
        setCurrentChunkIndex(currentChunkIndex + 1);
      }
    });
  };

  useEffect(() => {
    if (lastUploadedFileIndex === null) {
      return;
    }
    const isLastFile = lastUploadedFileIndex === files.length - 1;
    const nextFileIndex = isLastFile ? null : currentFileIndex + 1;
    setCurrentFileIndex(nextFileIndex);
  }, [lastUploadedFileIndex]);

  useEffect(() => {
    if (files.length > 0) {
      if (currentFileIndex === null) {
        setCurrentFileIndex(
          lastUploadedFileIndex === null ? 0 : lastUploadedFileIndex + 1
        );
      }
    }
  }, [files.length]);

  useEffect(() => {
    if (currentFileIndex !== null) {
      setCurrentChunkIndex(0);
    }
  }, [currentFileIndex]);

  useEffect(() => {
    if (currentChunkIndex !== null) {
      readAndUploadCurrentChunk();
    }
  }, [currentChunkIndex]);

  return (
    <div>
      <div
        onDragOver={(e) => {
          setDropzoneActive(true);
          e.preventDefault();
        }}
        onDragLeave={(e) => {
          setDropzoneActive(false);
          e.preventDefault();
        }}
        onDrop={(e) => handleDrop(e)}
        className={"dropzone" + (dropzoneActive ? " active" : "")}
      >
        <h3>Drop your files here to Upload !</h3>
      </div>
      <div className="files">
        {files.map((file, fileIndex) => {
          let progress = 0;
          if (file.finalFilename) {
            progress = 100;
          } else {
            const uploading = fileIndex === currentFileIndex;
            const chunks = Math.ceil(file.size / chunkSize);
            if (uploading) {
              progress = Math.round((currentChunkIndex / chunks) * 100);
            } else {
              progress = 0;
            }
          }
          return (
            <a
              className="file"
              target="_blank"
              href={"http://localhost:8000/public/" + file.finalFilename}
            >
              <div className="name">{file.name}</div>
              <div
                className={"progress " + (progress === 100 ? "done" : "")}
                style={{ width: progress + "%" }}
              >
                {progress}%
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default App;
