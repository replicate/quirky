import { useState, useEffect } from "react";
import Head from "next/head";
import Image from "next/image";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";
import FileSaver from "file-saver";
import promptmaker from "promptmaker";
import DarkModeToggle from "../components/DarkModeToggle";

const ogImage =
  "https://github.com/replicate/quirky/assets/14149230/953943c8-3e0c-46ae-8a2d-d6702ce24692";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Home() {
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [qr, setQR] = useState(null);
  const [url, setUrl] = useState("replicate.com");
  const [prompt, setPrompt] = useState(promptmaker());
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [selected, setSelected] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [darkMode]);

  const validateUrl = (value) => {
    try {
      new URL("https://" + value);
    } catch (err) {
      return false;
    }
    return true;
  };

  const handleDarkMode = () => {
    setDarkMode(!darkMode);
    setSelected(!selected);
  };

  const handleChange = (event) => {
    setUrl(event.target.value);
    if (!validateUrl(event.target.value)) {
      setError("Please enter a valid URL");
    } else {
      setError(null);
    }
  };

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
          quality: 10.0,
          margin: 2.0,
          version: 2,
          width: 1024,
        },
        async function (err, dataUrl) {
          setQR(dataUrl);

          console.log(dataUrl);

          resolve(dataUrl);
        }
      );
    });
  };

  return (
    <div className="bg-white dark:bg-gray-900">
      <div className="container max-w-2xl mx-auto p-5">
        <Head>
          <title>Quirky</title> <meta property="og:image" content={ogImage} />
          <meta
            property="og:description"
            content="Make really cool QR codes with AI."
          />
          <meta property="twitter:image" content={ogImage} />
          <meta name="twitter:card" content="summary_large_image" />
          <link
            rel="icon"
            href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔳</text></svg>"
          />
        </Head>

        <div className="text-center">
          <h1 className="pt-6 text-center font-bold text-4xl dark:text-gray-200">
            🔳 Quirky
          </h1>
          <h5 className="pt-3 text-xl text-gray-500 dark:text-gray-300">
            The{" "}
            <a className="underline" href="https://github.com/replicate/quirky">
              open source
            </a>{" "}
            tool for making really cool QR codes with AI.
          </h5>
        </div>

        <div className="text-center mt-4">
          <a href="https://replicate.com/docs?utm_source=project&utm_campaign=quirky">
            <div className="inline-flex items-center bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg mx-auto text-white text-lg sm:text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 mr-3"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
                />
              </svg>
              Want to make your own AI powered apps? Check out Replicate &rarr;
            </div>
          </a>
        </div>

        <div>
          <div className="relative mt-4 h-10 left-1/3 w-2/6 rounded-2xl bg-gray-200 p-1 dark:bg-gray-800">
            <div className="relative z-50 flex h-full w-full items-center">
              <div
                onClick={() => setDarkMode(!darkMode)}
                className="flex w-full cursor-pointer justify-center "
              >
                <button>
                  <svg
                    className="text-lg font-bold text-black dark:text-gray-300"
                    stroke="currentColor"
                    fill="currentColor"
                    strokeWidth="0"
                    viewBox="0 0 24 24"
                    height="1em"
                    width="1em"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M6.993 12c0 2.761 2.246 5.007 5.007 5.007s5.007-2.246 5.007-5.007S14.761 6.993 12 6.993 6.993 9.239 6.993 12zM12 8.993c1.658 0 3.007 1.349 3.007 3.007S13.658 15.007 12 15.007 8.993 13.658 8.993 12 10.342 8.993 12 8.993zM10.998 19h2v3h-2zm0-17h2v3h-2zm-9 9h3v2h-3zm17 0h3v2h-3zM4.219 18.363l2.12-2.122 1.415 1.414-2.12 2.122zM16.24 6.344l2.122-2.122 1.414 1.414-2.122 2.122zM6.342 7.759 4.22 5.637l1.415-1.414 2.12 2.122zm13.434 10.605-1.414 1.414-2.122-2.122 1.414-1.414z"></path>
                  </svg>
                </button>
              </div>
              <div
                onClick={handleDarkMode}
                className="flex w-full cursor-pointer justify-center"
              >
                <button>
                  <svg
                    className="text-lg font-bold text-black dark:text-gray-300"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    height="1em"
                    width="1em"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"></path>
                  </svg>
                </button>
              </div>
            </div>

            <span
              className={`text-sm absolute top-[4px] flex h-[1.88rem] w-1/2 items-center justify-center rounded-2xl bg-white opacity-60 shadow transition-all duration-200 ease-in dark:bg-black 
                  ${
                    selected
                      ? "text-indigo-600 left-1 font-semibold"
                      : "left-1/2 -ml-1 text-gray-800"
                  }`}
            ></span>
          </div>
        </div>

        <form className="w-full mt-6" onSubmit={handleSubmit}>
          <label
            for="url"
            className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
          >
            URL
          </label>
          <div className="mt-2 w-64">
            <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-600 sm:max-w-md">
              <span className="flex select-none items-center pl-3 text-gray-500 sm:text-sm dark:text-gray-100">
                https://
              </span>
              <input
                onChange={handleChange}
                type="text"
                name="url"
                id="text"
                className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                placeholder="Enter a url"
                value={url}
              />
            </div>
          </div>

          <div className="mt-4">
            <label
              for="prompt"
              className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
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
                placeholder="Describe your QR code"
                className="block p-3 w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div class="mt-6">
            <button
              type="button"
              onClick={() => setPrompt(promptmaker())}
              className="group inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-4 h-4 mr-3 transform transition-transform duration-500 group-hover:rotate-180"
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
                <span className="inline-flex items-center group">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    className="w-4 h-4 mr-3 duration-300 transform transition-transform group-hover:scale-150"
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
            className="block text-xl font-medium leading-6 text-gray-900 dark:text-gray-100"
          >
            QR Codes
          </label>

          {prediction ? (
            <div>
              {prediction.output ? (
                <div>
                  <p className="py-3 text-sm opacity-50">
                    Try scanning with your phone camera! If it doesn&apos;t
                    work, try again — sometimes it takes a few tries.
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
    </div>
  );
}
