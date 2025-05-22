import { useContext, useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";

// components
import { PageContainer } from "@/components";

// date
// import { DateTime } from "luxon";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";

// utils
import { backendAPI, setErrorMessage } from "@/utils";

export const Home = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { hasSetupBackend } = useContext(GlobalStateContext);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  // const [scheduledDateTime, setScheduledDateTime] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // for error states
  const [titleError, setTitleError] = useState("");
  const [messageError, setMessageError] = useState("");
  // const [scheduleError, setScheduleError] = useState("");

  // character limits
  const TITLE_CHAR_LIMIT = 40;
  const MESSAGE_CHAR_LIMIT = 140;

  // const [showDateTimePicker, setShowDateTimePicker] = useState(true);
  // const navigate = useNavigate();

  useEffect(() => {
    if (!hasSetupBackend) return;

    const fetchVisitor = async () => {
      backendAPI
        .get("/visitor")
        .then((response) => {
          setIsAdmin(response.data.visitor.isAdmin);
        })
        .catch((error) => {
          console.error("Visitor fetch error:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    };

    fetchVisitor();
  }, [hasSetupBackend, isAdmin]);

  const handleSetTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setTitleError("");
  };

  const handleSetMessage = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    setMessageError("");
  };

  // Function to fire a toast immediately
  const handleFireToast = async () => {
    setAreButtonsDisabled(true);
    let error = false;

    // Checks if title/message is missing or if they are over character limit
    if (!title) {
      setTitleError("Please enter a title before sending immediately.");
      error = true;
    } else if (title.length > TITLE_CHAR_LIMIT) {
      setTitleError(`Title must be ${TITLE_CHAR_LIMIT} characters or less`);
      error = true;
    } else {
      setTitleError("");
    }

    if (!message) {
      setMessageError("Please enter a message before sending immediately.");
      error = true;
    } else if (message.length > MESSAGE_CHAR_LIMIT) {
      setMessageError(`Title must be ${MESSAGE_CHAR_LIMIT} characters or less`);
      error = true;
    } else {
      setMessageError("");
    }

    // returns if there is an error
    if (error) {
      setSuccessMessage("");
      // setScheduleError("");
      setAreButtonsDisabled(false);
      return;
    }
    setSuccessMessage("");

    // calls the fireToast function
    backendAPI
      .post("/world/fire-toast", {
        // firing toast immediately
        title: title,
        text: message,
      })
      .then(() => {
        setSuccessMessage("🎉 Your message was sent!");
        // clear any previous errors
        setMessageError("");
        setTitleError("");
        setTitle("");
        setMessage("");
        // setScheduledDateTime("");
      })
      .catch((error) => setErrorMessage(dispatch, error))
      .finally(() => {
        setAreButtonsDisabled(false);
      });
  };

  // function to schedule toast - Currently not in use while scheduling is not available
  // const handleScheduleSend = async () => {
  //   // time variables to keep track of the entered time, pst transaltion, and minimum valid time
  //   const selectedTime = DateTime.fromISO(scheduledDateTime);
  //   const pacificTime = selectedTime.setZone("America/Los_Angeles");
  //   const now = DateTime.now();
  //   const minValidTime = now.plus({ minutes: 4 }); // 4 minute buffer for scheduling times
  //   let error = false;

  //   // Checks if title/message/scheduledTime is missing or if they are over character limit
  //   if (!title) {
  //     setTitleError("Please enter a title before scheduling.");
  //     error = true;
  //   } else if (title.length > TITLE_CHAR_LIMIT) {
  //     setTitleError(`Title must be ${TITLE_CHAR_LIMIT} characters or less`);
  //     error = true;
  //   } else {
  //     setTitleError("");
  //   }

  //   if (!message) {
  //     setMessageError("Please enter a message before scheduling.");
  //     error = true;
  //   } else if (message.length > MESSAGE_CHAR_LIMIT) {
  //     setMessageError(`Title must be ${MESSAGE_CHAR_LIMIT} characters or less`);
  //     error = true;
  //   } else {
  //     setMessageError("");
  //   }

  //   if (!selectedTime.isValid) {
  //     setScheduleError("Please enter a date before scheduling.");
  //     error = true;
  //   } else if (selectedTime <= minValidTime) {
  //     setScheduleError("Please select a future date and time that is at least 5 minutes ahead.");
  //     error = true;
  //   } else {
  //     setScheduleError("");
  //   }

  //   // returns if there is an error
  //   if (error) {
  //     setSuccessMessage("");
  //     setAreButtonsDisabled(false);
  //     return;
  //   }

  //   setSuccessMessage(""); // Clear previous success message
  //   backendAPI
  //     .post("/world/handle-schedule-toast", {
  //       // scheduling toast
  //       title: title,
  //       message: message,
  //       date_scheduled: pacificTime,
  //     })
  //     .then(() => {
  //       setMessageError("");
  //       setTitleError("");
  //       setScheduleError(""); // clear any previous error
  //       setSuccessMessage("Notification Scheduled! "); // Set success message
  //       setTitle("");
  //       setMessage("");
  //       setScheduledDateTime("");
  //     })
  //     .catch((error) => setErrorMessage(dispatch, error))
  //     .finally(() => {
  //       setAreButtonsDisabled(false);
  //     });
  // };

  // non-admin view shows no functionality

  return (
    <PageContainer isLoading={isLoading}>
      <div className="grid gap-4">
        {!isAdmin ? (
          <h3>Nothing to see here!</h3>
        ) : (
          <>
            <h3>Send a Notification to Users</h3>

            <div className="input-group">
              <label htmlFor="titleInput" className="label">
                Notification Title
              </label>
              <input
                id="titleInput"
                className="input"
                type="text"
                value={title}
                placeholder="Ex. Class is Ending"
                maxLength={TITLE_CHAR_LIMIT}
                onChange={(event) => handleSetTitle(event)}
              />
              <span className="input-char-count">
                {title.length}/{TITLE_CHAR_LIMIT}
              </span>
              {titleError && <div className="p3 text-error">{titleError}</div>}
            </div>

            <div className="input-group">
              <label htmlFor="messageInput" className="label">
                Notification Message
              </label>
              <textarea
                id="messageInput"
                value={message}
                maxLength={MESSAGE_CHAR_LIMIT}
                onChange={(event) => handleSetMessage(event)}
                className="input"
                placeholder="Ex. Please be ready to leave in 5 minutes!"
              />
              <span className="input-char-count">
                {message.length}/{MESSAGE_CHAR_LIMIT}
              </span>
              {messageError && <div className="p3 text-error">{messageError}</div>}
            </div>

            <button className="btn" disabled={areButtonsDisabled} onClick={handleFireToast}>
              Send Now
            </button>

            {/* Opens scheduling functionality when the user clicks the Schedule Send Button - Hidden for now */}
            {/* 
            <div className="mb-6">
              <label htmlFor="scheduleInput" className="block text-lg font-medium mb-1">
                Schedule a Date & Time
              </label>
              <input
                id="scheduleInput"
                type="datetime-local"
                value={scheduledDateTime}
                onChange={(e) => setScheduledDateTime(e.target.value)}
                className={`border p-2 rounded-md w-full ${scheduleError ? "border-red-500" : "border-gray-300"}`}
              />
              {scheduleError && <div className="text-red-500 text-sm mt-1">{scheduleError}</div>}
              {scheduledDateTime && (
                <p className="text-sm mt-2">
                  Scheduled for: <strong>{new Date(scheduledDateTime).toLocaleString()}</strong>
                </p>
              )}
              <div className="mt-3">
                <button className="btn" onClick={handleScheduleSend}>
                  Confirm Schedule
                </button>
              </div>
            </div>
            <button className="btn btn-outline" onClick={() => navigate("/scheduled-messages")}>
              View Scheduled Messages
            </button> 
            */}

            {/* Success Message */}
            {successMessage && <p className="p-4 text-center text-success">{successMessage}</p>}
          </>
        )}
      </div>
    </PageContainer>
  );
};

export default Home;
