const Sauce = require("../models/Sauce");
const fs = require("fs");
const jwt = require("jsonwebtoken");
exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  const sauce = new Sauce({
    ...sauceObject,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });
  sauce
    .save()
    .then(() => res.status(201).json({ message: "Objet enregistré !" }))
    .catch((error) => res.status(400).json({ error }));
};

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({
    _id: req.params.id,
  })
    .then((sauce) => {
      res.status(200).json(sauce);
    })
    .catch((error) => {
      res.status(404).json({
        error: error,
      });
    });
};

exports.modifySauce = (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];
  const decodedToken = jwt.verify(token, `${process.env.RND_TKN}`);
  const userId = decodedToken.userId;
  const sauce = req.body.userId;
  if (userId == sauce) {
    const sauceObject = req.file
      ? {
          ...JSON.parse(req.body.sauce),
          imageUrl: `${req.protocol}://${req.get("host")}/images/${
            req.file.filename
          }`,
        }
      : { ...req.body };
    Sauce.updateOne(
      { _id: req.params.id },
      { ...sauceObject, _id: req.params.id }
    )
      .then(() => res.status(200).json({ message: "Sauce modifiée !" }))
      .catch((error) => res.status(403).json({ error }));
  } else {
    res.status(403).json({ message: "Erreur" });
  }
};

exports.deleteSauce = (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];
  const decodedToken = jwt.verify(token, `${process.env.RND_TKN}`);
  const userId = decodedToken.userId;
  Sauce.findOne({ _id: req.params.id }).then((sauce) => {
    if (sauce.userId == userId) {
      const filename = sauce.imageUrl.split("/images/")[1];
      fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: "Sauce supprimé !" }))
          .catch((error) => res.status(400).json({ error }));
      });
    } else {
      res.status(403).json({ message: "Erreur" });
      console.log(sauce.userId);
    }
  });
};

exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .then((sauces) => {
      res.status(200).json(sauces);
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};

exports.likeOrNot = (req, res, next) => {
  if (req.body.like === 1) {
    Sauce.updateOne(
      { _id: req.params.id },
      {
        $inc: { likes: req.body.like++ },
        $push: { usersLiked: req.body.userId },
      }
    )
      .then((sauce) => res.status(200).json({ message: "Like ajouté !" }))
      .catch((error) => res.status(400).json({ error }));
  } else if (req.body.like === -1) {
    Sauce.updateOne(
      { _id: req.params.id },
      {
        $inc: { dislikes: req.body.like++ * -1 },
        $push: { usersDisliked: req.body.userId },
      }
    )
      .then((sauce) => res.status(200).json({ message: "Dislike ajouté !" }))
      .catch((error) => res.status(400).json({ error }));
  } else {
    Sauce.findOne({ _id: req.params.id })
      .then((sauce) => {
        if (sauce.usersLiked.includes(req.body.userId)) {
          Sauce.updateOne(
            { _id: req.params.id },
            { $pull: { usersLiked: req.body.userId }, $inc: { likes: -1 } }
          )
            .then((sauce) => {
              res.status(200).json({ message: "Like supprimé !" });
            })
            .catch((error) => res.status(400).json({ error }));
        } else if (sauce.usersDisliked.includes(req.body.userId)) {
          Sauce.updateOne(
            { _id: req.params.id },
            {
              $pull: { usersDisliked: req.body.userId },
              $inc: { dislikes: -1 },
            }
          )
            .then((sauce) => {
              res.status(200).json({ message: "Dislike supprimé !" });
            })
            .catch((error) => res.status(400).json({ error }));
        }
      })
      .catch((error) => res.status(400).json({ error }));
  }
};
