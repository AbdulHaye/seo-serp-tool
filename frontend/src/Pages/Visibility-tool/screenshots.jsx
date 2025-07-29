import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaSearchPlus, FaSearchMinus, FaDownload } from "react-icons/fa";
import "./screenshots.css";

function Screenshots() {
  const [images, setImages] = useState([]); // State for fetched screenshots
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // State for the selected image to view
  const [zoomLevel, setZoomLevel] = useState(1); // State for zoom level (1x by default)
  const [selectedFiles, setSelectedFiles] = useState([]); // State to store selected file names
  const fileInputRef = useRef(null); // Ref to access the hidden file input
  const imageRefs = useRef([]); // Refs for gallery images to observe

  // Placeholder image (low-resolution or blank image for lazy loading)
  const placeholderImage = "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwkLCAAAAACH5BAEAAAEALAAAAAABAAEAAAICTAEAOw=="; // Transparent 1x1 pixel

  // Fetch screenshots from the backend on component mount
  useEffect(() => {
    const fetchScreenshots = async () => {
      try {
        const response = await axios.get("/api/get-screenshots");
        setImages(response.data.reverse()); // Reverse the array to show the last screenshot first
      } catch (err) {
        setError("Failed to fetch screenshots. Please try again.");
        console.error("Error fetching screenshots:", err);
      }
    };

    fetchScreenshots();
  }, []); // Empty dependency array to run once on mount

  // Set up Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const imgElement = entry.target;
            const dataSrc = imgElement.getAttribute("data-src");
            if (dataSrc) {
              imgElement.src = dataSrc; // Load the actual image
              imgElement.removeAttribute("data-src"); // Remove data-src to prevent reprocessing
              observer.unobserve(imgElement); // Stop observing once loaded
            }
          }
        });
      },
      { rootMargin: "100px" } // Load images 100px before they enter the viewport
    );

    imageRefs.current.forEach((img) => {
      if (img) observer.observe(img);
    });

    return () => {
      imageRefs.current.forEach((img) => {
        if (img) observer.unobserve(img);
      });
    };
  }, [images]); // Re-run when images change

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const validImageTypes = ["image/jpeg", "image/png", "image/gif"];

    // Validate file types
    const invalidFiles = files.filter(
      (file) => !validImageTypes.includes(file.type)
    );
    if (invalidFiles.length > 0) {
      setError("Please upload valid image files (JPEG, PNG, GIF).");
      return;
    }

    // Update selected files display
    setSelectedFiles(files.map((file) => file.name));

    // Clear error and prepare to upload
    setError(null);
    setUploading(true);

    try {
      // Convert files to base64 for consistency with database storage
      const base64Images = await Promise.all(
        files.map((file) => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      );

      // Send base64 images to the backend API
      const type = files[0].name.split(".")[0]; // Use the file name as the type (simplified)
      await Promise.all(
        base64Images.map((image) =>
          axios.post("/api/save-screenshot", { image, type })
        )
      );

      // Fetch updated screenshots after upload
      const response = await axios.get("/api/get-screenshots");
      setImages(response.data.reverse()); // Reverse the array to show the last screenshot first

      setSelectedFiles([]); // Clear selected files after successful upload
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset the file input
      }
    } catch (err) {
      setError("Failed to upload images. Please try again.");
      console.error("Error uploading images:", err);
    } finally {
      setUploading(false);
    }
  };

  // Open the modal with the selected image
  const openImageModal = (image) => {
    console.log("Opening modal for image:", image.name);
    setSelectedImage(image);
    setZoomLevel(1); // Reset zoom level when opening a new image
  };

  // Close the modal
  const closeImageModal = () => {
    console.log("Closing modal");
    setSelectedImage(null);
    setZoomLevel(1); // Reset zoom level when closing the modal
  };

  // Zoom in (increase scale)
  const zoomIn = () => {
    console.log("Zooming in, current zoom level:", zoomLevel);
    setZoomLevel((prev) => Math.min(prev + 0.5, 3)); // Max zoom level of 3x
  };

  // Zoom out (decrease scale)
  const zoomOut = () => {
    console.log("Zooming out, current zoom level:", zoomLevel);
    setZoomLevel((prev) => Math.max(prev - 0.5, 1)); // Min zoom level of 1x
  };

  // Download the image
  const handleDownload = async () => {
    console.log("Downloading image:", selectedImage?.name);
    if (!selectedImage) return;

    try {
      // Convert base64 to blob
      const base64Data = selectedImage.image.split(",")[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/png" });

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link element to trigger the download
      const link = document.createElement("a");
      link.href = url;
      link.download = selectedImage.name; // Use the image name as the downloaded file name
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download image:", err);
      setError("Failed to download image. Please try again.");
    }
  };

  // Trigger the hidden file input
  const handleChooseFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <>
      <div className="container d-flex justify-content-center">
        <div className="screenshots-container">
          <h2 className="text-center mb-4 heading-upload">Upload Screenshots</h2>
          <div className="mb-4">
            <div className="form-label">Select Images</div>
            {/* Custom input wrapper */}
            <div className={`custom-file-input ${uploading ? "disabled" : ""}`}>
              <button
                type="button"
                className="choose-file-btn"
                onClick={handleChooseFileClick}
                disabled={uploading}
              >
                Choose Files
              </button>
              <span className="file-name-display">
                {selectedFiles.length > 0
                  ? selectedFiles.join(", ")
                  : "No files chosen"}
              </span>
              {/* Hidden file input */}
              <input
                type="file"
                id="image-upload"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/jpeg,image/png,image/gif"
                multiple
                onChange={handleImageUpload}
                disabled={uploading}
              />
              {/* Hidden label for screen readers */}
              <label htmlFor="image-upload" className="visually-hidden">
                Upload images (JPEG, PNG, GIF)
              </label>
            </div>
          </div>
          {uploading && (
            <div className="text-center mb-3">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Uploading...</span>
              </div>
            </div>
          )}
          {error && <div className="alert alert-danger">{error}</div>}
        </div>
      </div>

      <div className="container">
        {images.length > 0 && (
          <div className="image-gallery">
            <h3 className="text-center mb-4 heading-upload">Screenshots Gallery</h3>
            <div className="row">
              {images.map((image, index) => (
                <div key={index} className="col-md-4 mb-4">
                  <div className="card">
                    <img
                      src={placeholderImage} // Start with placeholder
                      data-src={image.image} // Store actual image URL in data-src
                      alt={image.name}
                      className="card-img-top"
                      style={{ height: "200px", objectFit: "cover", cursor: "pointer" }}
                      onError={(e) => {
                        e.target.src = "/placeholder-image.jpg"; // Fallback image if the base64 fails to load
                      }}
                      onClick={() => openImageModal(image)} // Open modal on click
                      ref={(el) => (imageRefs.current[index] = el)} // Assign ref for Intersection Observer
                    />
                    <div className="card-body">
                      <p className="card-text text-center">{image.name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal for viewing the selected image */}
      {selectedImage && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          aria-labelledby="imageModalLabel"
          aria-hidden="false"
        >
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="imageModalLabel">
                  {selectedImage.name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeImageModal}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <img
                  src={selectedImage.image} // Load full image in modal (no lazy loading needed here)
                  alt={selectedImage.name}
                  className="img-fluid zoomable-image"
                  style={{
                    width: "100%",
                    maxHeight: "70vh",
                    objectFit: "contain",
                    transform: `scale(${zoomLevel})`,
                    transition: "transform 0.3s ease", // Smooth zoom transition
                  }}
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn zoom-in"
                  onClick={zoomIn}
                  disabled={zoomLevel >= 3} // Disable zoom-in at max level
                >
                  <FaSearchPlus />
                </button>
                <button
                  type="button"
                  className="btn zoom-out"
                  onClick={zoomOut}
                  disabled={zoomLevel <= 1} // Disable zoom-out at min level
                >
                  <FaSearchMinus />
                </button>
                <button
                  type="button"
                  className="btn download"
                  onClick={handleDownload}
                >
                  <FaDownload /> Download
                </button>
                <button
                  type="button"
                  className="btn close-btn"
                  onClick={closeImageModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal backdrop */}
      {selectedImage && (
        <div className="modal-backdrop fade show" onClick={closeImageModal}></div>
      )}
    </>
  );
}

export default Screenshots;