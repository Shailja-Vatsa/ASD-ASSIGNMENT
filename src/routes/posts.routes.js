const router = require("express").Router();
const c = require("../controllers/posts.controller");

router.post("/", c.create);
router.get("/", c.list);
router.get("/:id", c.getOne);
router.patch("/:id", c.update);
router.delete("/:id", c.remove);

module.exports = router;
