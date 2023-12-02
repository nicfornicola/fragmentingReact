let http = require('http')
let fs   = require('fs');
let PNG  = require('pngjs').PNG;
const express = require('express');
const sharp = require('sharp');
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ dest: "uploads/", storage: storage });

const app = express();
const port = 3001;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname+'/public'));



// Image name to be fragmented
let imgName = "";
// How many images will be created and fragmented
let loops = 10

app.get('/list', async (req, res) => {
        if(imgName != "") {
            let imgPathFragged = "./client/public/images/fragged/" + imgName + "/" + imgName + 'Fragged' + 1 + '.png'
            setTimeout(function() { // Wait for the files to be written before trying to read them
                fs.readFile(imgPathFragged, (err, data) => {
                    // Check if a fragged file exists
                    if (!err && data) {
                        
                        // Start at one so we ignore the 0, just show original
                        let arrayList = [];
                        let pathName = imgName + "/" + imgName;
                        arrayList.push("/images/uploads/" + imgName + ".png")
    
                        for(let i = 1; i <= loops; i++) {
                            arrayList.push("/images/fragged/" + pathName + "Fragged" + i + ".png")
                        }
                        res.json({ 
                            list: JSON.stringify(arrayList), 
                            loops: loops
                        });
                    } else {
                        console.log("No fragged images at " + imgPathFragged)
                    }
                    
                })
    
            }, 100);
        } else {
            console.log("ERROR: imgName is empty")
        }
        
});

app.get('/loops', async (req, res) => {
    res.json({ 
        loops: loops
    });
});

app.get('/imageName', async (req, res) => {
    res.json({ 
        imgName: imgName
    });
});

app.post('/new_loops', upload.none(), async (req, res) => {
    loops = req.body.newLoops;
    res.status(200).json({ message: 'Data received successfully', data: loops });
});

app.post('/reset_name', upload.none(), async (req, res) => {
    imgName = req.body.newName;
    res.status(200).json({ message: 'Data received successfully', data: imgName });
});

app.post("/upload_file", upload.single("file"), uploadFile);
async function uploadFile(req, res) {
    try {
        // Assuming you are uploading an image in PNG format
        const processedImage = await sharp(req.file.buffer).toFormat('png').toBuffer();
        
        // Modify the file name as needed
        imgName = req.file.originalname.toLowerCase().replace(".png","");
        const uploadedPath = "./client/public/images/uploads/" + req.file.originalname.toLowerCase();

        fs.writeFile(uploadedPath, processedImage, (err) => {
            if (err) throw err;
            console.log(`Image ${uploadedPath} saved.`);
        });

        res.status(200).json({ message: 'Successfully uploaded and processed file' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// This is called when Fragment button is clicked
app.get('/frag', async (req, res) => {
    if(imgName != "") {
        fragmentImage();
        res.send({ message: 'Fragment!' });
    } else {
        console.log("Error: imgName is empty")
    }
        
});
const fragmentImage = async () => {
    // let killMap = [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
    let killMap = []
    let pixelSize = 20;

    for(let i; i < pixelSize; i++) {
        killMap.push([]);
    }

    // Create the folder path
    if (fs.existsSync("./client/public/images/fragged/" + imgName)) {
        console.log("Deleting " + "./client/public/images/fragged/" + imgName)
        await fs.promises.rm("./client/public/images/fragged/" + imgName, { recursive: true })
    }

    await fs.promises.mkdir("./client/public/images/fragged/" + imgName, { recursive: true })
    console.log("\nNew Fragmented pictures: " + "./client/public/images/fragged/" + imgName)

    // Original image path 
    let uploadImgPath = "./client/public/images/uploads/" + imgName + ".png";
    console.log("Original image used: " + uploadImgPath + "\n")
    

    // Loop through n times to create n new images
    let counter = 1;

    for (let factorOfFragment = 1; factorOfFragment <= loops; factorOfFragment++) {
       
        // Create new PNG and start the process
        let readStream = fs.createReadStream(uploadImgPath);
        readStream.pipe(new PNG()).on('parsed', function() {

            
            // Fill kill map with current factorOfFragment percentage of true so we know which chunks to delete
            fillMap(factorOfFragment, killMap, pixelSize);
            // Delete the n x n chunks, this = the new png
            deleteChunks(this, killMap, pixelSize);

            // Set the path for the new image to be created
            // i.e. "./public/images/fragged/frog/frogFragged6.png"
            let imgPathFragged = "./client/public/images/fragged/" + imgName + "/" + imgName + 'Fragged' + counter + '.png'
            console.log("Fragmenting " + factorOfFragment + "0%...")
            console.log("Created: " + imgPathFragged)

            // Write the new image to the file
            let writeStream = fs.createWriteStream(imgPathFragged);
            this.pack().pipe(writeStream);
            readStream.close();
            counter++;
        })
    }
}

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});


function getRandomInt(max) {
    return Math.ceil(Math.random() * max);
}

function fillMap(factorOfFragment, killMap, pixelSize) {
    // Fill the killMap with trues where we are going to kill stuff
    for (let y = 0; y < pixelSize+1; y++) {
        for (let x = 0; x < pixelSize+1; x++) {
            let rint = getRandomInt(loops)
            // If chunk is false and random number is less then factor, kill this chunk = true
            if(!killMap[y][x] && rint <= factorOfFragment) {
                killMap[y][x] = true;
            } 
        }
    }

}

function deleteChunks(img, killMap, pixelSize) {
    // Keeps tracks of n x n chunks 
    let yCounter = 0;
    let xCounter = 0;
    for (let y = 0; y < img.height ; y++) {
        for (let x = 0; x < img.width ; x++) {
            // Byte magic, don't ask
            let i = (img.width * y + x) << 2;
            let pixels = img.data;
            
            // If there is a true for this chunk in the killMap, kill it
            if(killMap[yCounter][xCounter]) {
                // Must do it 3 times because each RBG needs to be 255 for white
                pixels[i] = 255;
                pixels[i + 1] = 255;
                pixels[i + 2] = 255;
            }

            // If we are at a multiple of pixelSize then this ends the chunk, move on to next
            if(x % Math.ceil(img.width/pixelSize) == 0) {
                xCounter++;
            }
        }
        // Reset x chunk counter since we are going down a row
        xCounter = 0;
        // If we are at a multiple of pixelSize then this ends the chunk, move on to next
        if(y % Math.ceil(img.height/pixelSize) == 0)
            yCounter++;
    }

    // Return the fragmented image
    return img;
}

