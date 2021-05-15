
const compareImages = require("resemblejs/compareImages")
const config = require("./config.json");
const fs = require('fs');

const { viewportHeight, viewportWidth, browsers, options } = config;
let escenarios = [];
let steps = [];

async function executeTest(){

    let resultInfo = {}
    let report = '';
    let datetime = new Date().toISOString().replace(/:/g,".");

    // Search de Escenarios (Se asume que ambos folders de ghost tienen los mismos escenarios)
    escenarios = fs.readdirSync('./Ghost_3.3.0');
    console.log(JSON.stringify(escenarios));

    for(let i = 0; i < escenarios.length; i++){
      // Search de Pasos del escenario (Se asume maximo de pasos en version 3.42.5);
      steps = fs.readdirSync(`./Ghost_3.42.5/${escenarios[i]}`)
      console.log(JSON.stringify(steps));

      for(let k = 0; k < steps.length; k++){
        const data = await compareImages(
          fs.readFileSync(`./Ghost_3.3.0/${escenarios[i]}/${steps[k]}`),
          fs.readFileSync(`./Ghost_3.42.5/${escenarios[i]}/${steps[k]}`),
          options
        );
        resultInfo[escenarios[i]] = {};
        resultInfo[escenarios[i]][steps[k]] = {
            isSameDimensions: data.isSameDimensions,
            dimensionDifference: data.dimensionDifference,
            rawMisMatchPercentage: data.rawMisMatchPercentage,
            misMatchPercentage: data.misMatchPercentage,
            diffBounds: data.diffBounds,
            analysisTime: data.analysisTime
        }

        if (!fs.existsSync(`./results/${escenarios[i]}`)){
          fs.mkdirSync(`./results/${escenarios[i]}`, { recursive: true });
        }
        fs.writeFileSync(`./results/${escenarios[i]}/${steps[k].split('.')[0]}.compare.png`, data.getBuffer());
      }
      report = fs.readFileSync(`./results/report.html`) + createReport(datetime, escenarios[i], steps)
      fs.writeFileSync(`./results/report.html`, report );
      fs.copyFileSync('./index.css', `./results/index.css`);

    }
    
    
    
    console.log('------------------------------------------------------------------------------------')
    console.log("Execution finished. Check the report under the results folder")
    return resultInfo;  
  }
(async ()=>console.log(await executeTest()))();


function drawStep(escenario, step){
    return `<div class=" browser" id="test0">
    <div class=" btitle">
        <h2>Step: ${step}</h2>
        
    </div>
    <div class="imgline">
      <div class="imgcontainer">
        <span class="imgname">Ghost 3.3.0</span>
        <img class="img2" src="../Ghost_3.3.0/${escenario}/${step}" id="refImage" label="Reference">
      </div>
      <div class="imgcontainer">
        <span class="imgname">Test</span>
        <img class="img2" src="../Ghost_3.42.5/${escenario}/${step}" id="testImage" label="Test">
      </div>
      <div class="imgcontainer">
        <span class="imgname">Diff</span>
        <img class="img2" src="./${escenario}/${step.split('.')[0]}.compare.png" id="testImage" label="Test">
      </div>
    </div>
  </div>`
}

function createReport(datetime, escenario, steps){
    return `
    <html>
        <head>
            <title> VRT Report </title>
            <link href="index.css" type="text/css" rel="stylesheet">
        </head>
        <body>
            <h1>Report for scenario: ${escenario}
            </h1>
            <p>Executed: ${datetime}</p>
            <div id="visualizer">
                ${steps.map(step=>drawStep(escenario, step))}
            </div>
        </body>
    </html>`
}