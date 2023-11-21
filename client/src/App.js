// client/src/App.js

import React from "react";
import "./App.css";

function App() {
    const [pathList, setPathList] = React.useState([]);

    React.useEffect(() => {
        fetch("/list")
        .then((res) => res.json())
        .then((data) => setPathList(JSON.parse(data.list)));
    }, []);

    console.log(pathList)

    const listItems = pathList.map((path) =>
        <li key={path}>
            <img className="img" src={path} alt="fraggedImage"/>
        </li>
    );

    return (
    <div className="App">
      <header className="App-header">
        <div className="input-group">
            <label htmlFor='files'>Select files </label>
            <input
                type="file"
                name="myImage"
                onChange={(event) => {
                    console.log(event.target.files[0]);
                    upload(event.target.files[0]);
                }}
            />            
        </div>
        <form action="/frag">
            <button id="fragButton">Fragment</button>
        </form>
        <br/>
        Original: <br/>
        <ul> 
            {listItems}
        </ul>
      </header>
    </div>
  );
}

function upload(file) {
    const formData = new FormData();
    formData.append("file", file);
    
    fetch("/upload_file", {
        method: 'POST',
        body: formData
    
    })
    .then((res) => console.log(res))
    .catch((err) => ("Error occured", err));    
}

export default App;