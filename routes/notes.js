const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const fetchuser = require('../middleware/fetchuser');
const {body, validationResult} = require('express-validator')


//Route 1: Get All Notes using : GET "/api/notes/fetchallnotes" . Login Required
router.get('/fetchallnotes', fetchuser ,async (req ,res)=>{
    try{
        const notes = await Note.find({user:req.user.id});
        res.json(notes);
    }catch(err){
        console.log(err.message)
        res.status(500).send('Internal Server Error');
    }
})

//Route 2: Add a new Note using : POST "/api/notes/addnote" . Login Required
router.post('/addnote', fetchuser , [
    body('title','Enter a valid Title').isLength({min: 3}),
    body('description','Description must be atleast 5 characters').isLength({min:5})
],async (req ,res)=>{
    try{

        const {title,description,tag} = req.body;
        
        //If any errors, return bad request
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors:errors.array()})
        }
        const note = await new Note({
            title,description,tag,user:req.user.id
        })
        const savednote = await note.save() 
        res.json(savednote)
    }catch(err){
        console.log(err.message)
        res.status(500).send('Internal Server Error')
    }
})

//Route 3: Update an existing Note using : PUT "/api/notes/updatenote" . Login Required
router.put('/updatenote/:id', fetchuser ,async (req ,res)=>{
    try{
        const {title,description,tag} = req.body;
        //Create a new Note Object
        const NewNote = {};
        if(title){NewNote.title=title};
        if(description){NewNote.description=description};
        if(tag){NewNote.tag=tag};

        //Find the note to be updated and Update it
        let note = await Note.findById(req.params.id);
        if(!note){
            return res.status(400).send('Note not found');
        }

        if(note.user.toString() !== req.user.id){
            return res.status(401).send("Change not Allowed");
        }
        note = await Note.findByIdAndUpdate(req.params.id, {$set:NewNote}, {new:true});
        res.json({note});

    }catch(err){
        console.log(err.message);
        res.status(500).send('Internal Server Error')
    }
})


//Route 4: Delete an existing Note using : DELETE "/api/notes/updatenote" . Login Required
router.delete('/deletenote/:id', fetchuser ,async (req ,res)=>{
    try{

        //Find the note to be Deleted and Delete it
        let note = await Note.findById(req.params.id);
        if(!note){
            return res.status(400).send('Note not found');
        }

        //Check User Permissions
        if(note.user.toString() !== req.user.id){
            return res.status(401).send("Change not Allowed");
        }
        note = await Note.findByIdAndRemove(req.params.id);
        res.json({"Success":"Note has been Deleted",note:note});

    }catch(err){
        console.log(err.message);
        res.status(500).send('Internal Server Error')
    }
})

module.exports = router