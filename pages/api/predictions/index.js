import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export default async function handler(req, res) {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error(
      "The REPLICATE_API_TOKEN environment variable is not set. See README.md for instructions on how to set it."
    );
  }

  console.log(req.body);

  const prediction = await replicate.predictions.create({
    // See https://replicate.com/anotherjesse/multi-control/versions
    version: "76d8414a702e66c84fe2e6e9c8cbdc12e53f950f255aae9ffa5caa7873b12de0",

    // This is the text prompt that will be submitted by a form on the frontend
    input: {
      prompt: req.body.prompt,
      qr_image: req.body.qr_image,
      num_outputs: 4,
      low_threshold: 100,
      scheduler: "K_EULER",
      high_threshold: 200,
      guidance_scale: 9,
      image_resolution: 512,
      qr_conditioning_scale: 1.47,
      scribble_conditioning_scale: 1,
      normal_conditioning_scale: 1,
      hed_conditioning_scale: 1,
      canny_conditioning_scale: 1,
      depth_conditioning_scale: 1,
      hough_conditioning_scale: 1,
      seg_conditioning_scale: 1,
    },
  });

  if (prediction?.error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ detail: prediction.error }));
    return;
  }

  res.statusCode = 201;
  res.end(JSON.stringify(prediction));
}
