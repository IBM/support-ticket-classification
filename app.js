/* Copyright [XXXX] IBM Corp. All Rights Reserved.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.*/

"use strict";

require("dotenv").config();


const express = require("express");
const app = express();
const csv = require("csvtojson");
const bodyParser = require("body-parser");
const formidable = require("formidable");
const fs = require("fs");
const NaturalLanguageClassifierV1 = require("watson-developer-cloud/natural-language-classifier/v1");
var textnlc;
var textclass;

if (process.env.watson_nlc_iam_apikey && process.env.watson_nlc_iam_url !== '') {
  var naturalLanguageClassifier = new NaturalLanguageClassifierV1({
    url: process.env.watson_nlc_url,
    iam_apikey: process.env.watson_nlc_iam_apikey
  });
} else if (process.env.watson_nlc_username && process.env.watson_nlc_password !== ''){
  var naturalLanguageClassifier = new NaturalLanguageClassifierV1({
    url: process.env.watson_nlc_url,
    username: process.env.watson_nlc_username,
    password: process.env.watson_nlc_password
  });
} else {
  console.log("Error no env variables to create NLC.");
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname + "/public"));
app.get("/",function(req,res){
  res.sendFile("views/index.html", {"root": __dirname});
});

app.post("/uploadfile",function(req,res){
const form = new formidable.IncomingForm();
form.keepExtensions = true;
form.parse(req, function (err, fields, files) {
 if (err) {
  console.log("Error", err);
   } else {
    const filePath = JSON.parse(JSON.stringify(files));
    const workbook = filePath.nlcfile.path;
    csv({noheader: true,headers: ['text']}).fromFile(workbook).then((jsonObj)=>{
    const params = {
    classifier_id: process.env.watson_nlc_classifier_id,
    collection: jsonObj
    };
    naturalLanguageClassifier.classifyCollection(params,
    function(err, response) {
        if (err) {
        console.log("Error:", err);
        } else {
            for (var i=0;i<response.collection.length;i++){
            textnlc = JSON.stringify(response.collection[i].text);
            textclass = JSON.stringify(response.collection[i].top_class);
            res.write("<tr><td>");
            res.write(textnlc);
            res.write("</td>");
            res.write("<td>");
            res.write(textclass);
            res.write("</td></tr>");
            }
            res.end();
                    }
                });
                })
            }
    });
});

require("./config/error-handler")(app);

module.exports = app;