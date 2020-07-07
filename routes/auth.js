const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { check,validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Room = require('../models/rooms.js');


router.post("/create",[check('name').matches(/^[0-9a-zA-Z]+$/).withMessage('Room name must be alphanumeric.').isLength({min:4,max:25}).withMessage('Room name must be 4-25 characters.'),
check('password').matches(/^[0-9a-zA-Z]+$/).withMessage('Room password must be alphanumeric.').isLength({min:4,max:25}).withMessage('Room password must be 4-25 characters.'),
check('cpassword').custom((cpwd,{req}) => cpwd === req.body.password).withMessage('Passwords do not match.')], (req,res,next)=>{

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  Room.find({name:req.body.name}).exec((err,room)=>{
    if (err) next(err);

    if (room.length > 0) {

      return res.json({success:false});

    } else {

      bcrypt.genSalt(10, (err, salt) => {
        if (err) next(err);
          bcrypt.hash(req.body.password, salt, (err, hash) => {
            if (err) next(err);

            const newChatRoom = new Room({
              name:req.body.name,
              password:hash,
              socket_Room: uuidv4()
            });

            newChatRoom.save().then(()=>{
              return res.json({success:true});
            }).catch((err)=> next(err));



          });
      });


    }
  })


});

router.post("/join",[check('name').matches(/^[0-9a-zA-Z]+$/).withMessage('Room name must be alphanumeric.').isLength({min:4,max:25}).withMessage('Room name must be 4-25 characters.'),
check('username').matches(/^[0-9a-zA-Z]+$/).withMessage('Username must be alphanumeric.').isLength({min:4,max:25}).withMessage('Username must be 4-25 characters.'),
check('password').matches(/^[0-9a-zA-Z]+$/).withMessage('Room password must be alphanumeric.').isLength({min:4,max:25}).withMessage('Room password must be 4-25 characters.')],(req,res,next)=>{

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }


  Room.findOne({name:req.body.name}).exec((err,room)=>{
    if (err) next(err);
    if (room) {
      bcrypt.compare(req.body.password,room.password,(err,response)=>{
        if (err) next(err);
        if (response) {
          if (room.users.indexOf(req.body.username) == -1) {
            if (room.users.length < 7) {

              room.users.push(req.body.username);
              room.save().then(()=>{
                return res.json({success:true,room:room});
              }).catch((err) => next(err));

            } else {
              return res.status(403).json({errors:[{msg:'Max of 8 ppl allowed per room.'}]});
            }

          } else {
            return res.status(422).json({errors:[{msg:'User is already in room.'}]})
          }

        } else {
          return res.status(401).json({errors:[{msg:'Unauthorized.'}]});
        }

      });
    } else {
      return res.status(404).json({errors:[{msg:'Room does not exist.'}]});
    }
  })




});

router.post("/permission",[[check('name').matches(/^[0-9a-zA-Z]+$/).withMessage('Room name must be alphanumeric.').isLength({min:4,max:25}).withMessage('Room name must be 4-25 characters.'),
check('username').matches(/^[0-9a-zA-Z]+$/).withMessage('Username must be alphanumeric.').isLength({min:4,max:25}).withMessage('Username must be 4-25 characters.'),
check('password').isLength({min:4,max:100}).withMessage('Room password must be 4-25 characters.')]],(req,res,next)=>{

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  Room.findOne({name:req.body.name}).exec((err,room)=>{
    if (err) next(err);
    if (room) {
      if (room.password === req.body.password) {
        if (room.users.indexOf(req.body.username) > -1) {
          return res.json({room:room})
        } else {
          return res.status(422).send();
        }

      } else {
        return res.status(401).send();
      }
    } else {
      return res.status(404).send();
    }
  });



});

module.exports = router;
