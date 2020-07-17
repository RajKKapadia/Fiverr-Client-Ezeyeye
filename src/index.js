// external packages
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

// Start the webapp
const webApp = express();

// Webapp settings
webApp.use(bodyParser.urlencoded({
    extended: true
}));
webApp.use(bodyParser.json());

// Server Port
const PORT = process.env.PORT;

// Home route
webApp.get('/', (req, res) => {
    res.send(`Hello World.!`);
});

// Code for Google Sheet
require('dotenv').config();

const { GoogleSpreadsheet } = require('google-spreadsheet');

// spreadsheet key is the long id in the sheets URL
const SHEET_ID = process.env.SHEET_ID;
const doc = new GoogleSpreadsheet(SHEET_ID);

// Credentials for the service account
const CREDENTIALS = JSON.parse(process.env.CREDENTIALS);

const addNewRow = async (row) => {

    // use service account creds
    await doc.useServiceAccountAuth({
        client_email: CREDENTIALS.client_email,
        private_key: CREDENTIALS.private_key
    });

    await doc.loadInfo();

    let sheet = doc.sheetsByIndex[0];

    await sheet.addRow(row);
};
//

// Code for email
const nodemailer = require('nodemailer');
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL,
        pass: PASSWORD
    }
});

// Dialogflow route 
webApp.post('/webhook', async (req, res) => {

    let body = req.body.queryResult;

    // Get session id
    let session = req.body.session;
    let values = session.split('/');
    let sessionId = values[values.length - 1];

    let intentName = body.intent.displayName;

    let parameters = body.parameters;

    if (intentName == 'waiting_mail_phone') {

        let nombre = parameters.nombre;
        let rubro = parameters.rubro;
        let metros = parameters.metros;
        let consulta = parameters.consulta;
        let lugar = parameters.lugar;
        let cualquiercosa = parameters.cualquiercosa;
        let correo = parameters.email;
        let telefono = parameters.telefono;
        let tipoarreglos = parameters.tipoarreglos;
        let date = new Date();

        let data = {
            'id': sessionId,
            'datetime': date,
            'correo': correo,
            'nombre': nombre,
            'tel': telefono,
            'consulta': consulta,
            'lugar': lugar,
            'metros': metros,
            'rubro': rubro,
            'cualquiercosa': cualquiercosa,
            'tipoarreglos': tipoarreglos
        };

        await addNewRow(data);

        if (telefono == undefined) {
            telefono = 'No phone'
        }

        // send mail
        let mailOptions = {
            from: "firstpositionweb", // sender address
            to: "firstpositionweb@gmail.com", // list of receivers
            subject: "Nueva Conversación Chat", // Subject line
            html: `<h2>CONTACTO DESDE COSMIC-CHATBOT</h2><br>
             <p> Nombre: ${nombre} </p><br>
             <p> Email: ${correo}</p><br>
 		 	 <p> Telefono: ${telefono}</p><br>
			 <p> Consulta: ${consulta}</p><br>
            <p> Rubro: ${rubro}</p><br>
            <p> Metros: ${metros}</p><br>
            <p> ¿Que tipo de trabajos necesita hacer? ${tipoarreglos}</p><br>
            <p> Lugar: ${lugar}</p><br>
             <p> Otros comentarios: ${cualquiercosa}</p>`
        };

        transporter.sendMail(mailOptions, function (err, info) {
            if (err) {
                console.log(`Error at sendMAil --> ${err}`);
            }
        });

        res.send({
            fulfillmentText: `Gracias ${nombre}! Pronto nos pondremos en contacto para asesorarte.`
        });
    }
})

// Start the server
webApp.listen(PORT, () => {
    console.log(`Server is up and running at ${PORT}`);
});