const axios = require("axios");
const { Product } = require("../model/Product");
const stripe = require("stripe")("sk_test_tR3PYbcVNZZ796tH88S4VQ2u");

const fetchVouchersFromAPI = async () => {
  try {
    const options = {
      method: "POST",
      url: "https://stagingaccount.xoxoday.com/chef/v1/oauth/api/",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        Authorization: "Bearer YOUR_ACCESS_TOKEN_HERE",
      },
      data: {
        query: "plumProAPI.mutation.getVouchers",
        tag: "plumProAPI",
        variables: {
          data: {
            limit: 10,
            page: 1,
            exchangeRate: 1,
            sort: { field: "name", order: "ASC" },
          },
        },
      },
    };

    const response = await axios.request(options);
    return response.data?.result?.data;
  } catch (error) {
    console.error("Error fetching vouchers:", error.response.data);
    throw error;
  }
};

exports.populateVouchers = async (req, res) => {
  try {
    const vouchers = await fetchVouchersFromAPI();

    await Product.insertMany(vouchers);

    res.status(200).json({ message: "Vouchers populated successfully" });
  } catch (error) {
    console.error("Failed to populate vouchers:", error);
    res.status(500).json({ error: "Failed to populate vouchers" });
  }
};

exports.createProduct = async (req, res) => {
  const product = new Product(req.body);

  try {
    const stripeProduct = await stripe.products.create({
      name: product.title,
    });

    const price = await stripe.prices.create({
      unit_amount: product.price,
      currency: product.currency,
      product_data: {
        name: product.id,
      },
    });

    product.priceId = price.id;

    console.log(product);

    const doc = await product.updateOne(
      {
        providerId: product.providerId,
        price: product.price,
      },
      { $set: product },
      { upsert: true }
    );
    console.log(doc);

    res.status(201).json({ Stripe_res: price, db_res: doc });
  } catch (e) {
    res.status(400).json(e);
  }

  try {
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.fetchAllProducts = async (req, res) => {
  let condition = {};
  if (!req.query.admin) {
    condition.deleted = { $ne: true };
  }

  if (req.query.category) {
    condition.category = req.query.category;
  }

  if (req.query.brand) {
    condition.brand = req.query.brand;
  }

  let query = Product.find(condition);

  if (req.query._sort && req.query._order) {
    query = query.sort({ price: req.query._order });
  }

  const totalDocs = await Product.countDocuments(condition);

  if (req.query._page && req.query._limit) {
    const pageSize = parseInt(req.query._limit);
    const page = parseInt(req.query._page);
    query = query.skip(pageSize * (page - 1)).limit(pageSize);
  }

  try {
    const docs = await query.exec();
    res.set("X-Total-Count", totalDocs);
    res.status(200).json(docs);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.fetchProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);
    res.status(200).json(product);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.updateProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.status(200).json(product);
  } catch (err) {
    res.status(400).json(err);
  }
};
