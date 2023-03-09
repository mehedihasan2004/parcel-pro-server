import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGO_DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const bookingEmailSending = (parcelInfo) => {
  const { email, sender_email, receiver_email } = parcelInfo;

  const auth = {
    auth: {
      api_key: process.env.EMAIL_SENDING_KEY,
      domain: process.env.EMAIL_SENDIGN_DOMAIL,
    },
  };

  const transporter = nodemailer.createTransport(mg(auth));

  transporter.sendMail({
    from: "parcel@pro.com",
    to: email,
    subject: `${sender_email} has sent a parcel for you`,
    text: `Hi ${receiver_email},`,
    html: `
    <h2>Your parcel on the way.</h2> </br>
    <div>
    <p>Have a spendild day</p> </br>
    <p>Thank you !</p>
    </div>
    `,
  });
};

const run = async () => {
  try {
    const usersCollection = client.db("parcel-pro").collection("users");
    const riderCollection = client.db("parcel-pro").collection("riders");
    const orderCollection = client.db("parcel-pro").collection("orders");
    const parcelInfoCollection = client
      .db("parcel-pro")
      .collection("parcel_info");

    app.get("/users", async (req, res) => {
      res.send(await usersCollection.find({}).toArray());
    });

    app.get("/admin/:email", async (req, res) => {
      const user = await usersCollection.findOne({ email: req.params.email });
      res.send({ isAdmin: user?.role === "admin" });
    });

    app.get("/my_orders", async (req, res) => {
      res.send(
        await parcelInfoCollection
          .find({
            sender_email: req.query.email,
          })
          .toArray()
      );
    });

    app.get("/pending_orders", async (req, res) => {
      res.send(await parcelInfoCollection.find({ state: "pending" }).toArray());
    });

    app.get("/accepted_orders", async (req, res) => {
      res.send(await parcelInfoCollection.find({ state: "accept" }).toArray());
    });

    app.get("/delivered_orders", async (req, res) => {
      res.send(
        await parcelInfoCollection.find({ state: "delivered" }).toArray()
      );
    });

    app.get("/cyclist_orders", async (req, res) => {
      res.send(
        await parcelInfoCollection
          .find({ product_weight: { $in: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] } })
          .toArray()
      );
    });

    app.get("/biker_orders", async (req, res) => {
      res.send(
        await parcelInfoCollection
          .find({
            product_weight: { $in: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20] },
          })
          .toArray()
      );
    });

    app.get("/pickup_orders", async (req, res) => {
      res.send(
        await parcelInfoCollection
          .find({ product_weight: { $gte: 21 } })
          .toArray()
      );
    });

    app.get("/rider", async (req, res) => {
      res.send(await usersCollection.findOne({ email: req.query.email }));
    });

    app.get("/riders", async (req, res) => {
      res.send(await riderCollection.find({}).toArray());
    });

    app.post("/users", async (req, res) => {
      res.send(await usersCollection.insertOne(req.body));
    });

    app.post("/parcel_info", async (req, res) => {
      const {
        sender_email,
        sender_phone,
        receiver_email,
        receiver_phone,
        sender_location,
        receiver_location,
        product_weight,
        parcel_type,
        payment_method,
        pressed_time,
        state,
        charge,
      } = req.body;

      const data = {
        sender_email,
        sender_phone,
        receiver_email,
        receiver_phone,
        sender_location,
        receiver_location,
        product_weight: parseFloat(product_weight),
        parcel_type,
        payment_method,
        pressed_time,
        state,
        charge,
      };
      res.send(await parcelInfoCollection.insertOne(data));
    });

    app.post("/riders", async (req, res) => {
      res.send(await riderCollection.insertOne(req.body));
    });

    app.post("/accepted_orders", async (req, res) => {
      res.send(await orderCollection.insertOne(req.body));
    });

    app.put("/riders/:id", async (req, res) => {
      res.send(
        await riderCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: { state: "accept" } },
          { upsert: true }
        )
      );
    });

    app.put("/accept/:id", async (req, res) => {
      res.send(
        await parcelInfoCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: { state: "accept" } },
          { upsert: true }
        )
      );
    });

    app.put("/delivered/:id", async (req, res) => {
      res.send(
        await parcelInfoCollection.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: { state: "delivered" } },
          { upsert: true }
        )
      );
    });
  } catch (err) {
    console.log(err);
  } finally {
  }
};

run().catch((err) => console.log(err));

app.get("/", async (req, res) => {
  res.send(
    "Hello I'm from Parcel Pro Server. I'm ready to pick you parcel...................."
  );
});

app.listen(8080, () =>
  console.log("Server has started on port http://localhost:8080")
);
