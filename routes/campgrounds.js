var express= require ("express");
var Campground = require ("../models/campground");
var User=require("../models/user");
const { cloudinary, upload } = require('../middleware/cloudinary');
var async = require("async");
var crypto = require("crypto");
var router=express.Router();
// express router

// INDEX 
router.get("/",function(req,res){	
	console.log(req.user);
	// ini mengambil data user
	Campground.find().sort({'createdAt': 'asc'}).exec(function(err,allcampgrounds){
	// kalau mau cari spesifik isi objectnya
	if(err){
		console.log(err);
	}else{
		User.find({},function(err,foundBiodata){
			res.render("campgrounds/index",{campgrounds:allcampgrounds, currentUser : req.user,biodata:foundBiodata})
		})
	}
})
	// res.render("campgrounds",{campgrounds:campgrounds})
})
router.get("/search",function(req,res){
	var search=req.body.search;
	if (req.query.search) {
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		Campground.find({ "name": regex }, function(err, foundCampgrounds) {
			if(err) {
				console.log(err);
			} else {
				res.render("campgrounds/index",{campgrounds:foundCampgrounds, currentUser:req.user});
			}
		}); 
	}else{
		res.redirect("/startup")
	}
})
// CREATE
router.post("/",isLoggedIn,upload.single('image'),function(req,res){
	if(req.file){
		cloudinary.uploader.upload(req.file.path,function(result){
			var name=req.body.name;
			var image=result.secure_url;
			var description=req.body.description;
			var author = {
				id: req.user._id,
				username : req.user.username,
				image : req.user.image
			}
			var newCampgrounds={name:name,image:image,description:description,author:author};
	// simpan ke database
	Campground.create(newCampgrounds),function(err,newCampground){
		if(err){
			console.log(err)
		}else{
			res.redirect("/startup")
			console.log(newCampground)
		}
	}
	res.redirect("/startup")
})
	}else{
		var name=req.body.name;
		var description=req.body.description;
		var author = {
			id: req.user._id,
			username : req.user.username,
			image : req.user.image
		}
		var newCampgrounds={name:name,description:description,author:author};
	// simpan ke database
	Campground.create(newCampgrounds),function(err,newCampground){
		if(err){
			console.log(err)
		}else{
			res.redirect("/startup")
			console.log(newCampground)
		}
	}
	res.redirect("/startup")
}
})
// new
router.get("/new",isLoggedIn,function(req,res){
	res.render("campgrounds/new");
})
// show
router.get("/:id",function(req,res){
	// kalau : digunakan untuk paramenter /isinya boleh apa saja
	console.log(req.params.id)
	// untuk membuat comment nya berisi
	Campground.findById(req.params.id).populate("comments").exec(function(err,foundCampgrounds){
		if(err){
			console.log(req.params.id);
			console.log(err);
		}else{
			console.log(foundCampgrounds)
			var commentCount = foundCampgrounds.comments.length;
			// console.log(commentCount);
			res.render("campgrounds/show",{campground:foundCampgrounds,commentCount:commentCount})
		}
	})
})

// EDIT ROUTES
router.get("/:id/edit",checkOwnership,function(req,res){
	// check if the user is logged in
	Campground.findById(req.params.id ,function(err,foundCampground){
		// tidak bisa pakai === karena satu object satu string
		res.render("campgrounds/edit",{campground : foundCampground});
	})
})
// UPDATE ROUTES
router.put("/:id",checkOwnership,upload.single('image'),function(req,res){
	if(req.file){
		cloudinary.uploader.upload(req.file.path,function(result){
			var name=req.body.name;
			var image=result.secure_url;
			var description=req.body.description;
			var author = {
				id: req.user._id,
				username : req.user.username,
				image : req.user.image
			}
			var updateCampgrounds={name:name,image:image,description:description,author:author};
			Campground.findByIdAndUpdate(req.params.id,updateCampgrounds,function(err,updatedCampground){
				if(err){
					res.redirect("/startup");
				}else{
					res.redirect("/startup/"+req.params.id);
				}
			})
		})
	}
})
// DELETE ROUTES
router.delete("/:id",checkOwnership,function(req,res){
	Campground.findByIdAndRemove(req.params.id,function(err){
		if(err){
			console.log(err);
			res.redirect("/startup");
		}else{
			req.flash("success","Delete Successfull!");
			res.redirect("/startup");
		}
	})
});

// middleware
function isLoggedIn(req,res,next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error","Please Login First");
	res.redirect("/login");
}
function checkOwnership(req,res,next){
		// check if the user is logged in
		if(req.isAuthenticated()){
			Campground.findById(req.params.id ,function(err,foundCampground){
				if(err){
					res.redirect("back");
				}else{
				// is the user own the campgrounds?
				if(foundCampground.author.id.equals(req.user._id) || req.user._id.equals("5a23729c8a83510014e945da")){
					// tidak bisa pakai === karena satu object satu string
					next();
				}else{
					res.redirect("back");
				}
			}
		})
		}else{
			res.redirect("/login");
		}
	}
	function escapeRegex(text) {
		return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
	};

	module.exports= router;