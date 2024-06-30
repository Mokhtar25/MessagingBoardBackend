import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  content: {
    type: String,
    minLength: 1,
    required: true,
  },
  username: {
    type: String,
    minLength: 2,
    required: true,
  },
  likes: {
    type: Number,
    default: 0,
  },
  sentDate: {
    type: Date,
    default: () => Date.now(),
  },
});

MessageSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

const Message = mongoose.model("Message", MessageSchema);
export default Message;
