import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mailService from "./mailService.js";
import originalProductData from "./originalProductData.json" assert { type: "json" };

const originalData = originalProductData;
let productsInStock = [];

const resetProductsInStock = () => {
  productsInStock = [];

  originalData.forEach((element) => {
    productsInStock.push({
      name: element.name,
      price: element.price,
      inStock: element.inStock,
      description: element.description,
      image: element.image,
      id: element.id,
    });
  });
};

resetProductsInStock();

dotenv.config();
const APPLICATION_PORT = process.env.APPLICATION_PORT ?? 3000;

const app = express();

app.use(cors());
app.use(bodyParser.json({ extended: true }));

app.post("/reset-stock", (req, res) => {
  resetProductsInStock();

  return res.status(200).json({
    message: "Stock reset successfully.",
  });
});

app.get("/products", (req, res) => {
  return res.status(200).json({
    products: productsInStock,
  });
});

app.get("/products/:id", (req, res) => {
  const { id } = req.params;

  const product = productsInStock.find((product) => product.id === id);

  return res.status(200).json({
    message: product ? "Product found." : "Product not found.",
    product,
  });
});

app.post("/products/buy", async (req, res) => {
  const { id, quantity, userEmail } = req.body;

  if (!userEmail) {
    return res.status(400).json({
      message: "User email is required.",
    });
  }

  if (!id) {
    return res.status(400).json({
      message: "Product ID is required.",
    });
  }

  if (!quantity || quantity <= 0) {
    return res.status(400).json({
      message: "Quantity must be greater than 0.",
    });
  }

  const product = productsInStock.find(
    (product) => product.id === id.toString()
  );

  if (!product) {
    return res.status(404).json({
      message: "Product not found.",
    });
  }

  const productIndex = productsInStock.findIndex((p) => p.id === id.toString());

  if (product.inStock < quantity) {
    return res.status(400).json({
      message: "Insufficient stock.",
    });
  }

  try {
    const mailResponse = await mailService.post("/send-email", {
      to: userEmail,
      subject: "Product purchased successfully!",
      text: `Thank you for your purchase of ${quantity} ${product.name}!`,
      secretKey: process.env.MAIL_SERVICE_SECRET_KEY
    });  

    if (mailResponse.status == 200) {
      product.inStock -= quantity;
      productsInStock[productIndex] = product;
  
      return res.status(200).json({
        message: "Product purchased successfully.",
        totalValue: mailResponse.data.totalValue,
      });
    } else {
      return res.status(400).json({
        message: "Error purchasing product.",
      });
    }
  } catch (error) {
    return res.status(400).json({
      message: "Error purchasing product.",
    });
  }
});

app.listen(APPLICATION_PORT, () => {
  console.log(`App started on port ${APPLICATION_PORT}.`);
});
