/*
  General controller to describe all interactions with events
*/

const events = require("../../db/models/event/index");
const { getAll } = require("../../services/helpers");
const logger = require("../../services/logger");
const { isSameAuthor } = require("../controllers/auth.controller");

/*
  Receiving data about a specific event
  route get("/event/:id")
*/
module.exports.getEvent = (req, res) => {
  try {
    const { id } = req.params;
    events
      .findById(id)
      .then(event => {
        if (!event) throw new Error();
        res.status(200).json(event);
      })
      .catch(e => res.status(404).json("Event is not found"));
  } catch (e) {
    res.status(500).json({ error: "Server error" });
    logger.error("ErrGerEvent", e);
  }
};

/*
  Getting data about all events
  route get("/events")
*/
module.exports.getAllEvents = async (req, res) => {
  try {
    const pageOptions = {
      page: parseInt(req.query.page) || 0,
      limit: parseInt(req.query.perPage) || 5
    };
    const { model: allEvents, error } = await getAll(events, pageOptions);
    if (error) return res.status(400).json(error);
    return res.status(200).json(allEvents);
  } catch (e) {
    res.status(500).json({ server: "Server error" });
    logger.error("ErrGetAllEvents", e);
  }
};

/*
  Event creation
  route post("/event")
*/
module.exports.createEvent = async (req, res, next) => {
  console.log("req", req.body)
  try {
    const { title, date, subscribedUsers, text, end, start } = req.body;
    events
      .create({
        authorId: req.user.id,
        title: title,
        end: end,
        start: start,
        date: date,
        text: text,
        subscribedUsers: subscribedUsers
      })
      .catch(err => {
        res.status(400).json({ error: "Create error" });
      })
      .then(res => console.log("res", res))
      .then(next());
  } catch (e) {
    res.status(500).json({ server: "Server errorr" });
    logger.error("ErrCreateEvent", e);
  }
};

/* 
Edit event
route put("/event/:id") 
*/
module.exports.editEvent = async (req, res) => {
  try {
    // Is the author of the user or admin
    if (!(await isSameAuthor(events, req))) {
      return res.status(403).json("Forbidden");
    }
    const { id } = req.params;
    const updateData = {
      ...req.body
    };

    // User couldn't change autor
    if (!req.user.admin) delete updateData.authorId;

    await events
      .findByIdAndUpdate(id, { $set: { ...updateData } })
      .then(result => res.status(200).json(result))
      .catch(error => res.status(400).json({ error: "Edit error" }));
  } catch (e) {
    res.status(500).json({ server: "Server error" });
    logger.error("ErrEditEvent", e);
  }
};

/*
  Delete event
  route delete("/event/:id")
*/
module.exports.deleteEvent = async (req, res, next) => {
  try {
    // Is the author of the user or admin
    if (!(await isSameAuthor(events, req))) {
      return res.status(403).json("Forbidden");
    }
    const { id } = req.params;
    events
      .findByIdAndDelete(id)
      .then(event => {
        if (!event) throw new Error();
        next();
      })
      .catch(e => res.status(404).json("Event is not found"));
  } catch (e) {
    res.status(500).json({ server: "Server error" });
    logger.error("ErrEditEvent", e);
  }
};

/*
Subscribe on event
route put("/event/:id/subscribe")
*/
module.exports.subscribeEvent = (req, res) => {
  try {
    const { id } = req.params;
    events
      .findByIdAndUpdate(id, { $addToSet: { subscribedUsers: { id: req.body.id } } }, { new: true })
      .then(result => res.status(200).json(result))
      .catch(err => {
        res.status(400).json({ error: "Subscribe error" });
      });
  } catch (e) {
    res.status(500).json({ server: "Server error" });
    logger.error("ErrSubscribe", e);
  }
};

/*
Subscribe from all evets
route put("/events/subscribe")
*/
module.exports.subscribeAllEvents = (req, res, next) => {
  try {
    events.updateMany({}, { $addToSet: { subscribedUsers: { id: req.body.id } } }).catch(err => {
      res.status(400).json({ error: "Subscribe error" });
    });
    next();
  } catch (e) {
    res.status(500).json({ server: "Server error" });
    logger.error("ErrAllSubscribe", e);
  }
};

/*
Unsubscribe on event 
route put("/event/:id/unsubscribe")
*/
module.exports.unsubscribeEvent = (req, res) => {
  try {
    const { id } = req.params;
    events
      .findByIdAndUpdate(id, { $pull: { subscribedUsers: req.body.id } }, { new: true })
      .then(result => res.status(200).json(result))
      .catch(err => {
        res.status(400).json({ error: "Unsubscribe error" });
      });
  } catch (e) {
    res.status(500).json({ server: "Server error" });
    logger.error("ErrUnsubscribeToEvent", e);
  }
};

/*
  Unsubscribe from all events
  route route(/events/unsubscribe)
*/
module.exports.unsubscribeAllEvents = (req, res) => {
  try {
    events
      .updateMany({}, { $pull: { subscribedUsers: { $in: [req.body.id] } } }, { new: true })
      .then(result => {
        res.status(200).json({ success: true });
      })
      .catch(err => {
        res.status(400).json({ success: false });
      });
  } catch (e) {
    res.status(500).json({ server: "Server error" });
    logger.error("ErrAllSubscribe", e);
  }
};
