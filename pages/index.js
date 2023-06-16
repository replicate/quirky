import { useState } from "react";
import Head from "next/head";
import Image from "next/image";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";
import FileSaver from "file-saver";
import promptmaker from "promptmaker";

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
  const [prompt, setPrompt] = useState(promptmaker());

  const download = async (url, id) => {
    FileSaver.saveAs(url, `QR-${id}.png`);
  };

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
      { type: "image/png", quality: 1.0, margin: 1.2, width: 512 },
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

      <h1 className="py-6 text-center font-bold text-2xl">🔳 Qrky</h1>

      <form className="w-full" onSubmit={handleSubmit}>
        <label
          for="url"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          URL
        </label>
        <div className="mt-2 w-64">
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

        <div className="mt-4">
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

        <div class="mt-6">
          <button
            type="button"
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-4 h-4 mr-3 "
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            Prompt
          </button>
          <button
            type="submit"
            className="ml-3 inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-4 h-4 mr-3"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Create
          </button>
        </div>
      </form>

      {error && <div>{error}</div>}

      {prediction && (
        <div className="mt-12">
          <label
            for="url"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            QR Codes
          </label>
          {prediction.output ? (
            <div>
              <div className="grid grid-cols-4 gap-4  mt-4">
                {prediction.output.map((output) => (
                  <div className="image-wrapper rounded-sm">
                    <button
                      className="hover:brightness-50"
                      onClick={() => download(output, prediction.id)}
                    >
                      <img src={output} alt="" />
                    </button>
                  </div>
                ))}
              </div>

              <p className="py-3 text-sm opacity-50">
                Try scanning with your phone camera! If it doesn't work, try
                again, sometimes it takes a few tries.
              </p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-4 gap-4 mt-5">
                <img
                  className="rounded-sm"
                  src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmRkOTU0ZmVmZjA2OGQzN2Y5YjQ0YjQ2YmU2MzE4OTgxNjVmNTM0ZCZjdD1n/SrpYgjOxiKvBxVS9s2/giphy.gif"
                  alt=""
                />
                <img
                  className="rounded-sm"
                  src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmRkOTU0ZmVmZjA2OGQzN2Y5YjQ0YjQ2YmU2MzE4OTgxNjVmNTM0ZCZjdD1n/SrpYgjOxiKvBxVS9s2/giphy.gif"
                  alt=""
                />
                <img
                  className="rounded-sm"
                  src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmRkOTU0ZmVmZjA2OGQzN2Y5YjQ0YjQ2YmU2MzE4OTgxNjVmNTM0ZCZjdD1n/SrpYgjOxiKvBxVS9s2/giphy.gif"
                  alt=""
                />
                <img
                  className="rounded-sm"
                  src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmRkOTU0ZmVmZjA2OGQzN2Y5YjQ0YjQ2YmU2MzE4OTgxNjVmNTM0ZCZjdD1n/SrpYgjOxiKvBxVS9s2/giphy.gif"
                  alt=""
                />
              </div>

              <p className="py-3 text-sm opacity-50">
                status: {prediction.status}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
