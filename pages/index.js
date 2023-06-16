import { useState } from "react";
import Head from "next/head";
import Image from "next/image";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";
import FileSaver from "file-saver";
import promptmaker from "promptmaker";

const ogImage =
  "https://github.com/replicate/quirky/assets/14149230/953943c8-3e0c-46ae-8a2d-d6702ce24692";
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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const uploadedUrl = await createQR(e.target.url.value);

    console.log(`uploadedUrl is `, uploadedUrl);
    const response = await fetch("/api/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: e.target.prompt.value,
        qr_image: uploadedUrl,
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
        setLoading(false);
        return;
      }
      console.log({ prediction });
      setPrediction(prediction);

      if (prediction.status === "succeeded") {
        setLoading(false);
      }
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
    return new Promise((resolve, reject) => {
      QRCode.toDataURL(
        url,
        {
          type: "image/png",
          quality: 1.0,
          margin: 1.2,
          version: 2,
          width: 512,
        },
        async function (err, dataUrl) {
          setQR(dataUrl);

          console.log(dataUrl);

          //   const blob = dataURItoBlob(dataUrl);

          //   const imageName = `QR-${uuidv4()}.png`;

          //   // upload controlnet image
          //   const { data, error } = await supabase.storage
          //     .from("images")
          //     .upload(`public/${imageName}`, blob);

          //   if (data) {
          //     console.log(
          //       `successfully uploaded ${JSON.stringify(data)}, ${imageName}`
          //     );
          //   } else {
          //     console.log(
          //       `failed uploaded ${JSON.stringify(error)}, ${imageName}`
          //     );
          //     window.alert("Failed to upload image");
          //     return;
          //   }

          //   const newImageURL = `${supabaseUrl}/storage/v1/object/public/images/public/${imageName}`;
          //   console.log("uploaded URL: ", newImageURL);
          resolve(dataUrl);
        }
      );
    });
  };

  return (
    <div className="container max-w-2xl mx-auto p-5">
      <Head>
        <title>Quirky — Make Really Cool QR Codes with AI.</title>{" "}
        <meta property="og:image" content={ogImage} />
        <meta property="twitter:image" content={ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔳</text></svg>"
        />
      </Head>

      <div className="text-center">
        <h1 className="pt-6 text-center font-bold text-2xl">🔳 Quirky</h1>
        <h5 className="pt-3 text-xs text-gray-500">
          Make really cool QR Codes with AI. <br /> A free and{" "}
          <a className="underline" href="https://github.com/replicate/quirky">
            open source
          </a>{" "}
          project by the{" "}
          <a
            className="underline"
            href="https://replicate?utm_source=project&utm_campaign=quirky"
          >
            Replicate
          </a>{" "}
          Hackers.
        </h5>
      </div>

      <form className="w-full mt-6" onSubmit={handleSubmit}>
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
            onClick={() => setPrompt(promptmaker())}
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
            {loading ? (
              <span className="inline-flex items-center">
                <svg
                  aria-hidden="true"
                  class="w-4 h-4 mr-3 text-gray-200 animate-spin fill-blue-600"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
                Loading...
              </span>
            ) : (
              <span className="inline-flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  className="w-4 h-4 mr-3"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Create
              </span>
            )}
          </button>
        </div>
      </form>

      {error && <div>{error}</div>}

      <div className="mt-12">
        <label
          for="url"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          QR Codes
        </label>

        {prediction ? (
          <div>
            {prediction.output ? (
              <div>
                <p className="py-3 text-sm opacity-50">
                  Try scanning with your phone camera! If it doesn&apos;t work,
                  try again — sometimes it takes a few tries.
                </p>
                <div className="grid grid-cols-2 gap-4  mt-4">
                  {prediction.output.map((output, i) => (
                    <div key={i} className="image-wrapper rounded-sm">
                      <a
                        className="hover:brightness-50"
                        href={output}
                        target="_blank"
                        download="download"
                        rel="noopener noreferrer"
                        //   onClick={() => download(output, prediction.id)}
                      >
                        <img src={output} alt="" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-2 gap-4 mt-5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} class="relative">
                      <img src={qr} alt="" />
                      <img
                        className="rounded-sm h-full w-full absolute top-0 left-0 opacity-50"
                        src="/loading.webp"
                        alt=""
                      />
                    </div>
                  ))}
                </div>

                <p className="py-3 text-sm opacity-50">
                  status: {prediction.status}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div class="">
            <div className="grid grid-cols-2 gap-4 mt-5">
              {[1, 2, 3, 4].map((i) => (
                <a
                  key={i}
                  className="hover:brightness-50"
                  href={`/seed/qr${i}.png`}
                  target="_blank"
                  download="download"
                  rel="noopener noreferrer"
                >
                  <img src={`/seed/qr${i}.png`} alt="" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
