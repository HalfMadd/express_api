const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;

const app = express();
const v1 = express.Router();
require('dotenv').config();

const basicAuth = require('./middleware/basic-auth').basicAuth;

const MessageService = require('./services/message-service');
const messageService = new MessageService;

const FileService = require('./services/file-service');
const fileService = new FileService();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/api/v1', v1);

v1.get('/message', async (request, response) => {

    const quotes = await messageService.getMessages();
    response.setHeader('content-type', 'application/json');
    response.send(quotes);
})

v1.get('/message/:id', async (request, response) => {

    const id = request.params.id;
    try {
        const message  = await messageService.getMessage(id);

        message ? response.send(message) : response.sendStatus(404);
    } catch(e) {
        response.sendStatus(400);
    }
})

v1.post('/message', basicAuth, async (request, response) => {
    const message = request.body;
    console.log('message?', message);

    const isValid = message.quote && message.quote.length > 0 && message.author && message.author.length > 0;
    if(!isValid) return response.sendStatus(400);

    const createdMessage = messageService.createMessage(message);

    response.send(createdMessage);
    response.send(message);
});

v1.delete('/message/:id', basicAuth, async (request, response) => {
    const id = request.params.id;
    try {
        const isDeleted = await messageService.deleteMessage(id);
        isDeleted ? response.sendStatus(204) : response.sendStatus(404);
    } catch (e){
        response.sendStatus(400);
    }
});

v1.put('/message/:id', basicAuth, async (request, response) => {
    const id = request.params.id;
    const message = request.body;
    if (!MessageService.isValid(message)) return sendStatus(400);
    try {
        const result = await messageService.updateMessage(message, id);
        if(!result.isFind) return response.sendStatus(404);
        result.isModified ? response.sendStatus(200) : response.sendStatus(304);
    } catch(e){
        console.log('error occurs : ', e);
        response.sendStatus(400);
    }
});

const multer = require('multer');
const upload = multer({ dest: 'data/upload/' });

v1.post('/file', upload.single('myFile'), (request, response) => {
    try {
        await fileService.saveFileInfos(request.file);
        response.sendStatus(200);
    }catch(e){
        response.sendStatus(500);
    }
});

v1.get('/file', async (request, response) => {
    try {
        const filesInfo = await fileService.getFilesInfo();
        response.send(filesInfo);
    } catch(e) {
        console.log('error occurs ', e);
        response.sendStatus(500);
    }
});

v1.get('/file/:id', async (request, response) => {
    const id = request.params.id;
    try{
        const file = await fileService.getFilesInfo(id);
        if(file) {
            response.setHeader(
                'Content-disposition',
                'attachment: filename=' + fileresult.fileInfo['original-name']
            );
            response.setHeader('Content-type', fileResult.fileInfo['mime-type']);
            response.setHeader('Content-length', fileResult.fileInfo.size);
            fileResult.file.pipe(response);
        }else{
            response.sendStatus(404);
        }
    } catch(e){
        console.log('error occurs ', e);
        response.sendStatus(500);
    }
});

v1.delete('/file/:id', async (request, response) => {
    const id = request.params.id;
    try{
        await fileService.deleteFile(id);
        response.sendStatus(200);
    }catch(e){
        console.log('error occurs ', e);
        response.sendStatus(500);
    }
})

app.listen(3000, () => {
    console.log("Listening on port 3000");
});




