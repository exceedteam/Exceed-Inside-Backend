/*
  General controller to describe all interactions with events
*/
const events = require("../../db/models/event/index");
const users = require("../../db/models/user/index");
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
      limit: parseInt(req.query.perPage) || 50
    };
    const { model: allEvents, error } = await getAll(events);
    if (error) return res.status(400).json(error);
    const eventsWithAuthor = allEvents.map(async event => {
      return await users
        .findById(event.authorId)
        .then(user => {
          if (!user) throw new Error();
          return {
            author: {
              name: user.firstName + " " + user.lastName,
              ...user.toObject()
            },
            ...event.toObject()
          };
        })
        .catch(error => {
          console.log("author error ", error);
        });
    });
    Promise.all(eventsWithAuthor)
      .then(events => {
        return res.status(200).json(events);
      })
      .catch(() => {
        res.status(500).json({ error: "Serer error" });
      });
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
      .then(event => {
        users.findById(req.user.id).then(user => {
          const eventObj = event.toObject();
          const author = user.toObject();
          eventObj.author = {
            name: author.firstName + " " + author.lastName,
            ...author
          };
          res.status(200).json(eventObj);
        });
      });
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
      .catch(() => res.status(400).json({ error: "Edit error" }));
    await events.findById(id).then(event => {
      users.findById(req.user.id).then(user => {
        const eventObj = event.toObject();
        const author = user.toObject();
        eventObj.author = {
          name: author.firstName + " " + author.lastName,
          ...author
        };
        res.status(200).json(eventObj);
      });
    });
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
      .findByIdAndUpdate(
        id,
        { $addToSet: { subscribedUsers: { id: req.user.id } } },
        { new: true }
      )
      .then(result => res.status(200).json({ success: true }))
      .catch(err => {
        res.status(400).json({ success: false });
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
module.exports.subscribeAllEvents = (req, res) => {
  try {
    events
      .updateMany({}, { $addToSet: { subscribedUsers: { id: req.user.id } } })
      .catch(err => {
        res.status(400).json({ error: "Subscribe error" });
      })
      .then(() => {
        res.status(200).json({ success: true });
      });
  } catch (e) {
    res.status(500).json({ success: false });
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
      .findByIdAndUpdate(
        id,
        { $pull: { subscribedUsers: { id: req.user.id } } },
        { new: true }
      )
      .then(result => res.status(200).json({ success: true }))
      .catch(err => {
        res.status(400).json({ success: false });
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
      .updateMany(
        {},
        { $pull: { subscribedUsers: { id: { $in: [req.user.id] } } } },
        { new: true }
      )
      .then(() => {
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
