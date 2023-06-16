import { useState } from "react";
import Head from "next/head";
import Image from "next/image";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ennwjiitmiqwdrgxkevm.supabase.co";
const supabasePublicKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVubndqaWl0bWlxd2RyZ3hrZXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODM5Mjc3OTgsImV4cCI6MTk5OTUwMzc5OH0.zCHzwchIjcmKNmccb9D4OLVwrWrpLHMmf4a8W7UedFs";

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabasePublicKey);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Home() {
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [qr, setQR] = useState(null);
  const [url, setUrl] = useState("replicate.com");
  const [prompt, setPrompt] = useState(
    "whippet, flemish baroque, el yunque rainforest, 35mm film, quadtone color grading, chromakey"
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    const uploadedUrl = await createQR(e.target.url.value);

    console.log(`uploadedUrl is `, qr);
    const response = await fetch("/api/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: e.target.prompt.value,
        qr_image: qr,
      }),
    });
    let prediction = await response.json();
    if (response.status !== 201) {
      setError(prediction.detail);
      return;
    }
    setPrediction(prediction);

    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed"
    ) {
      await sleep(1000);
      const response = await fetch("/api/predictions/" + prediction.id);
      prediction = await response.json();
      if (response.status !== 200) {
        setError(prediction.detail);
        return;
      }
      console.log({ prediction });
      setPrediction(prediction);
    }
  };

  function dataURItoBlob(dataURI) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    var byteString = atob(dataURI.split(",")[1]);

    // separate out the mime component
    var mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);

    // create a view into the buffer
    var ia = new Uint8Array(ab);

    // set the bytes of the buffer to the correct values
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    // write the ArrayBuffer to a blob, and you're done
    var blob = new Blob([ab], { type: mimeString });
    return blob;
  }

  const createQR = async (url) => {
    QRCode.toDataURL(
      url,
      { type: "image/png", quality: 1.0, margin: 1.0, width: 500 },
      async function (err, dataUrl) {
        setQR(dataUrl);

        console.log(dataUrl);

        const blob = dataURItoBlob(dataUrl);

        const imageName = `QR-${uuidv4()}.png`;

        // upload controlnet image
        const { data, error } = await supabase.storage
          .from("images")
          .upload(`public/${imageName}`, blob);

        if (data) {
          console.log(
            `successfully uploaded ${JSON.stringify(data)}, ${imageName}`
          );
        } else {
          console.log(`failed uploaded ${JSON.stringify(error)}, ${imageName}`);
          window.alert("Failed to upload image");
          return;
        }

        const newImageURL = `${supabaseUrl}/storage/v1/object/public/images/public/${imageName}`;
        console.log("uploaded URL: ", newImageURL);
        setQR(newImageURL);
        return newImageURL;
      }
    );
  };

  return (
    <div className="container max-w-2xl mx-auto p-5">
      <Head>
        <title>Replicate + Next.js</title>
      </Head>

      <h1 className="py-6 text-center font-bold text-2xl">Qrky</h1>

      <form className="w-full" onSubmit={handleSubmit}>
        <label
          for="url"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          URL
        </label>
        <div className="mt-2">
          <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-600 sm:max-w-md">
            <span className="flex select-none items-center pl-3 text-gray-500 sm:text-sm">
              https://
            </span>
            <input
              onChange={(e) => setUrl(e.target.value)}
              type="text"
              name="url"
              id="text"
              className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
              placeholder="Enter a url"
              value={url}
            />
          </div>
        </div>

        <div className="mt-8">
          <label
            for="prompt"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            Prompt
          </label>
          <div className="mt-2">
            <input
              onChange={(e) => setPrompt(e.target.value)}
              value={prompt}
              id="prompt"
              name="prompt"
              type="text"
              className="block p-3 w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <button
          type="submit"
          className="mt-6 rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Go!
        </button>
      </form>

      {error && <div>{error}</div>}

      {prediction && (
        <>
          {prediction.output && (
            <div className="grid grid-cols-4 gap-4">
              {prediction.output.map((output) => (
                <div className="image-wrapper mt-5">
                  <img src={output} alt="" />
                </div>
              ))}
            </div>
          )}

          <p className="py-3 text-sm opacity-50">status: {prediction.status}</p>
        </>
      )}
    </div>
  );
}
