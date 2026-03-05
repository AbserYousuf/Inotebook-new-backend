const Note = require('../Models/Notes')
const token = require('../Middleware/token')
const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
router.post('/createnotes', token, async (req, res) => {
    const { title = "", description = "" } = req.body
    const id = req.userId
    if (!id) {
        return res.status(409).json({
            success: false,
            msg: "Authorization required"
        })
    }
    try {
        const cleanedtitle = title.trim()
        const cleaneddescription = description.trim()
        if (!cleanedtitle && !cleaneddescription) {
            return res.status(400).json({
                success: false,
                msg: "Please write something to save your notes "
            })
        }
        if (cleanedtitle.length > 200) {
            return res.status(400).json({
                success: false,
                msg: "Title too Long (maximum 200 characters allowed)"
            })
        }
        if (cleaneddescription.length > 11000) {
            return res.status(400).json({
                success: false,
                msg: "Description too long (maximum 17000 characters allowed)"
            })
        }
        const note = await Note.create({
            title: cleanedtitle || "",
            description: cleaneddescription,
            user: id
        })
        return res.status(201).json({
            success: true,
            msg: "Note created successfully",
            note: note
        })


    } catch (error) {
        console.error(error, "Note creation failed")
        return res.status(500).json({
            success: false,
            msg: "We caught Some Error  while Saving your notes... Please Try after some time"
        })
    }
})
router.get('/getnotes', token, async (req, res) => {
    const id = req.userId
    if (!id) {
        return res.status(409).json({
            success: false,
            msg: "Authorization required"
        })
    }
    try {
        const notes = await Note.find({ user: id }).sort({ createdAt: -1 }).select('-__v')

        return res.status(200).json({
            success: true,
            msg: notes.length === 0 ? "No Notes Found" : "Notes Fetched SuccessFully",
            notes: notes
        })
    } catch (error) {
        console.error(`Failed to get the notes for user${id}:`, error)
        return res.status(500).json({
            success: false,
            msg: "Some Error Occurred During Fetching Your notes"
        })
    }
})
router.put('/updatenotes/:id', token, async (req, res) => {
    const userid = req.userId
    const notesid = req.params.id
    if (!userid) {
        return res.status(409).json({
            success: false,
            msg: "Authorization Required"
        })
    }
    if (!mongoose.Types.ObjectId.isValid(notesid)) {
        return res.status(400).json({
            success: false,
            msg: "Invalid note ID"
        });
    }
    try {
        const notes = await Note.findById(notesid)
        if (!notes) {
            return res.status(404).json({
                success: false,
                msg: "Notes Not Found"
            })
        }
        if (notes.user.toString() !== userid) {
            return res.status(403).json({
                success: false,
                msg: "Access Denied"
            })
        }
        const { title = "", description = "" } = req.body
        const cleanedtitle = title.trim()
        const cleaneddescription = description.trim()

        if (!cleaneddescription && !cleanedtitle) {
            return res.status(400).json({
                success: false,
                msg: "Please Write Something to Update Your Notes"
            })
        }
        if (cleanedtitle.length > 200) {
            return res.status(400).json({
                success: false,
                msg: "Title too Long (maximum 200 characters allowed)"
            })
        }
        if (cleaneddescription.length > 11000) {
            return res.status(400).json({
                success: false,
                msg: "Description too long (maximum 17000 characters allowed)"
            })
        }
        const newNotes = {}
        if (cleanedtitle) { newNotes.title = cleanedtitle }
        if (cleaneddescription) { newNotes.description = cleaneddescription }
        const updatedNotes = await Note.findByIdAndUpdate(notesid, { $set: newNotes }, { new: true, runValidators: true })
        return res.status(200).json({
            success: true,
            msg: "Notes Updated Successfully",
            notes: updatedNotes
        })
    } catch (error) {
        console.error(`Notes Updation Failed for note ${notesid}! by user ${userid}`, error)
        return res.status(500).json({
            success: false,
            msg: "Some Error Occurred During Notes Updation"
        })
    }

})
router.delete('/deletenotes/:id', token, async (req, res) => {
    const userid = req.userId
    const notesid = req.params.id
    if (!userid) {
        return res.status(409).json({
            success: false,
            msg: "Authorization required"
        })
    }
    if (!mongoose.Types.ObjectId.isValid(notesid)) {
        return res.status(400).json({
            success: false,
            msg: "Invalid note ID"
        });
    }
    try {
        const notes = await Note.findById(notesid)
        if (!notes) {
            return res.status(404).json({
                success: false,
                msg: "Notes Not Found"
            })
        }
        if (notes.user.toString() !== userid) {
            return res.status(403).json({
                success: false,
                msg: "Access Denied"
            })
        }
        await Note.findByIdAndDelete(notesid)
        return res.status(200).json({
            success: true,
            msg: "Note deleted Successfully"
        })

    } catch (error) {
        console.error(`Failed To Delete Notes ${notesid} by user ${userid}`, error)
        return res.status(500).json({
            success: false,
            msg: "Error Occurred on Deleting the notes"
        })
    }
})
module.exports = router;