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
    // See https://replicate.com/nateraw/qrcode-stable-diffusion
    version: "9cdabf8f8a991351960c7ce2105de2909514b40bd27ac202dba57935b07d29d4",

    // This is the text prompt that will be submitted by a form on the frontend
    input: {
      prompt: req.body.prompt,
      qr_code_content: req.body.url,
      batch_size: 4,
      strength: 0.9,
      guidance_scale: 7.5,
      negative_prompt: "ugly, disfigured, low quality, blurry, nsfw",
      num_inference_steps: 40,
      controlnet_conditioning_scale: 1.5,
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
