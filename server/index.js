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
let imageDir = '/public/images/';
let imageDirPath = imageDir + 'fragged/' + imgName;

app.get('/list', async (req, res) => {
        let imgPathFragged ="./client" + imageDirPath + '/' + imgName + 'Fragged' + loops + '.png'
        setTimeout(function() { // Wait for the files to be written before trying to read them
            fs.readFile(imgPathFragged, (err, data) => {
                // Check if a fragged file exists
                if (!err && data) {
                    // Setup template for html tags
                    
                    // Start at one so we ignore the 0, just show original
                    let arrayList = [];
                    let pathName = imgName + "/" + imgName;
                    arrayList.push("/images/uploads/" + imgName + ".png")

                    for(let i = 1; i <= loops; i++) {
                        // Send to front to make '<img class="img" src="/images/fragged/{{imgName}}/{{imgName}}Fragged{{fragNumA}}.png" alt="Fragment{{fragNumA}}">' +
                        arrayList.push("/images/fragged/" + pathName + "Fragged" + i + ".png")
                    }
                    res.json({ list: JSON.stringify(arrayList) });
                } else {
                    console.log("No fragged at " + imgPathFragged)
                }
                
            })

        }, 50);

});

// This is called when Fragment button is clicked
app.get('/frag', async (req, res) => {
    fragmentImage();
    res.send('Fragment!');
});

app.post("/upload_file", upload.single("file"), uploadFile);
async function uploadFile(req, res) {
    console.log("UPLOAD")
    try {
        // Assuming you are uploading an image in PNG format
        const processedImage = await sharp(req.file.buffer).toFormat('png').toBuffer();

        // Modify the file name as needed
        const imgName = req.file.originalname.toLowerCase();
        const uploadedPath = "./client" + imageDir + 'uploads/' + imgName;

        fs.writeFile(uploadedPath, processedImage, (err) => {
            if (err) throw err;
            console.log(`Image ${imgName} saved.`);
        });

        res.json({ message: 'Successfully uploaded and processed file' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});


function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function fillMap(factorOfFragment, killMap) {
    // Fill the killMap with trues where we are going to kill stuff
    for (let y = 0; y < 17; y++) {
        for (let x = 0; x < 17; x++) {
            let rint = getRandomInt(50)
            // If chunk is false and random number is less then factor, kill this chunk = true
            if(!killMap[y][x] && rint < factorOfFragment) {
                killMap[y][x] = true;
            } 
        }
    }
}

function deleteChunks(img, killMap) {
    // Keeps tracks of 16x16 chunks 
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

            // If we are at a multiple of 16 then this ends the chunk, move on to next
            if(x % Math.ceil(img.width/16) == 0) {
                xCounter++;
            }
        }
        // Reset x chunk counter since we are going down a row
        xCounter = 0;
        // If we are at a multiple of 16 then this ends the chunk, move on to next
        if(y % Math.ceil(img.height/16) == 0)
            yCounter++;
    }

    // Return the fragmented image
    return img;
}

const fragmentImage = async () => {
    let killMap = [[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]

    // Create the folder path
    await fs.promises.mkdir(imageDirPath, { recursive: true })
    console.log("\nNew Fragmented pictures: " + imageDirPath)

    // Original image path 
    let uploadImgPath = imageDir + 'uploads/'+ imgName;
    console.log("Original image used: " + uploadImgPath + "\n")
    
    // Set where the stream will read from
    let readStream = fs.createReadStream(uploadImgPath);

    // Loop through n times to create n new images
    for (let factorOfFragment = 1; factorOfFragment <= loops; factorOfFragment++) {
        // Create new PNG and start the process
        readStream.pipe(new PNG()).on('parsed', function() {

            // Fill kill map with current factorOfFragment percentage of true so we know which chunks to delete
            fillMap(factorOfFragment, killMap);
            // Delete the 16x16 chunks
            deleteChunks(this, killMap);

            // Set the path for the new image to be created
            // i.e. "./public/images/fragged/frog/frogFragged6.png"
            let imgPathFragged = imageDirPath + "/" + imgName + 'Fragged' + factorOfFragment + '.png'
            console.log("Fragmenting " + factorOfFragment + "0%...")
            console.log("Created: " + imgPathFragged)

            // Write the new image to the file
            let writeStream = fs.createWriteStream(imgPathFragged);
            this.pack().pipe(writeStream);
        })
    }
}