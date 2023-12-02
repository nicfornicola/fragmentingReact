// client/src/App.js

import React from "react";
import "./App.css";
import NumberPicker from "react-widgets/NumberPicker";


function App() {
    const [pathList, setPathList] = React.useState([]);
    const [percent, setPercent] = React.useState(0);
    const [file, setFile] = React.useState(null);
    const [loops, setLoops] = React.useState(10);
    const [fragButtonClass, setFragButtonClass] = React.useState("fragButtonInVis");
    const [imgName, setImgName] = React.useState("");

    React.useEffect(() => {
        getList();
        getImgName();
    }, []);

    React.useEffect(() => {
        fetch("/loops")
        .then((res) => res.json())
        .then((data) => {
            setPercent(JSON.parse(1/data.loops))
            setLoops(JSON.parse(data.loops))
        });

    }, []);

    const getList = (event) => {
        fetch("/list")
        .then((res) => res.json())
        .then((data) => {
            setPathList(JSON.parse(data.list))
        });
    }; 

    const getImgName = (event) => {
        fetch("/imageName")
        .then((res) => res.json())
        .then((data) => {
            console.log(data.imgName)
            if(data.imgName !== "") {
                setFragButtonClass("fragButtonVis");
                setImgName(data.imgName.charAt(0).toUpperCase() + data.imgName.slice(1))
            } 
        });
    }; 

    const original = pathList.slice(0,1).map((path) => {
        
        let title = "Original " + imgName;
        return ( 
            <div key={path}>
                <div>{title}</div>
                <img className="img" src={path} alt="fraggedImage"/>
            </div>
        )
    });

    let currentPercent = percent;
    const listItems = pathList.slice(1).map((path) => {
        
        let title = Math.round(currentPercent * 100)  + "%";
        currentPercent += percent;

        return ( 
            <li key={path}>
                <div>{title}</div>
                <img className="img" src={path} alt="fraggedImage"/>
            </li>
        )
        
    });

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };
    
    const handleUploadAndSetPath = async (event) => {
        event.preventDefault(); 
        if (file) {
            await upload(file, setFragButtonClass);
        }
    };

    // adding more images means I want to decrease the rate at which the image disapears
    const handleLoopChange = (newLoops) => {
        setLoops(newLoops);
        callBackEndLoops(newLoops)
    };

    const handleFrag = () => {
        window.location.reload();

        fetch("/frag")
          .then((res) => res.json())
          .then((data) => console.log(data.message))
          .catch((error) => console.error("Error calling /frag endpoint:", error));
    };

    const handleReset = () => {
        window.location.reload();

        callBackEndLoops(10);
        setLoops(10);    
        setImgName("");
        callBackEndResetName();
        setFragButtonClass("fragButtonInVis");
    };

    return (
    <div className="App">
      <header className="App-header">
        <div className="input-group">
            <label htmlFor='file'>Select Image to Fragment </label>
            <form className="form" onSubmit={handleUploadAndSetPath}>
                <input
                    type="file"
                    name="myImage"
                    onChange={handleFileChange}
                />
                <button
                    type="submit"
                    className="submit-btn"
                >
                Upload
                </button>
            </form>
            <button
                type="button"
                className={fragButtonClass}
                onClick={handleFrag}
            >
                Fragment {imgName}
            </button>
            <br/>
            <label>Number of Images</label>
            <NumberPicker
                value={loops}
                onChange={value => handleLoopChange(value)}
            />

            <button 
                type="button"
                className="resetButton"
                onClick={handleReset} >
            Reset Values
            </button>
        
        </div>
        
        

        <div className="help">
            <ol>
                <li>Choose File</li>
                <li>Upload</li>
                <li>Fragment</li>
            </ol>
        </div>
        
        <br/>
        {original}
        <ol> 
            {listItems}
        </ol>
      </header>
    </div>
  );
}

async function callBackEndLoops(newLoops) {
    const formData = new FormData();
    formData.append("newLoops", newLoops);
  
    await fetch("/new_loops", {
      method: "POST",
      body: formData,
    });
}

async function callBackEndResetName() {
    const formData = new FormData();
    formData.append("newName", "");
  
    await fetch("/reset_name", {
      method: "POST",
      body: formData,
    });
}

async function upload(file, setFragButtonClass) {
    const formData = new FormData();
    formData.append("file", file);
    // const response = 
    await fetch("/upload_file", {
      method: "POST",
      body: formData,
    })

}

export default App;