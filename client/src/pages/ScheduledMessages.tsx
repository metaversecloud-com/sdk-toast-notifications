import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { backendAPI } from "@/utils";
import { DateTime } from "luxon";

export const ScheduledMessages = () => {
  // imitates the structure of world data object in handleSetDataObjects
  const [messages, setMessages] = useState<{
    [key: string]: { title: string; message: string; date_scheduled: string; displayName: string };
  }>({});

  const navigate = useNavigate();

  // fetches the word data object and initializes local variable - merges all messages to include multiple admins
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await backendAPI.get("/world/handle-get-toasts");
        console.log("Response:", response.data.savedData.messages); // Debugging log

        // explicitly type messagesData
        const messagesData: Record<
          string,
          Record<string, { title: string; message: string; date_scheduled: string; displayName: string }>
        > = response.data.savedData.messages;

        if (messagesData && typeof messagesData === "object") {
          // merge all messages from different profile IDs into a single object
          const allMessages = Object.values(messagesData).reduce(
            (acc, profileMessages) => {
              return { ...acc, ...profileMessages };
            },
            {} as Record<string, { title: string; message: string; date_scheduled: string; displayName: string }>,
          );

          setMessages(allMessages);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Delete scheduled message
  const handleDeleteMessage = async (jobId: string) => {
    try {
      const response = await backendAPI.post("/world/handle-delete-toast", { jobId });

      if (response.data.success) {
        // Remove message from UI
        setMessages((prevMessages) => {
          const updatedMessages = { ...prevMessages };
          delete updatedMessages[jobId];
          return updatedMessages;
        });
      } else {
        console.error("Failed to delete message:", response.data.error);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  // formats date to be more readable in the cards
  const formatDate = (dateString: string) => {
    const pacificTime = DateTime.fromISO(dateString, { zone: "America/Los_Angeles" });
    const localTime = pacificTime.setZone(Intl.DateTimeFormat().resolvedOptions().timeZone);

    const dateFormatted = localTime.toLocaleString(DateTime.DATE_MED); // e.g., Apr 15, 2025
    const timeFormatted = localTime.toLocaleString(DateTime.TIME_SIMPLE); // e.g., 4:15 PM

    return {
      date: dateFormatted,
      time: timeFormatted,
    };
  };

  const hasMessages = Object.keys(messages).length > 0;

  return (
    <div className="relative p-6 pt-16 pb-24">
      <h1 className="text-2xl font-bold mb-4">Scheduled Messages</h1>

      {hasMessages ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(messages).map(([jobId, message]) => {
            const { date, time } = formatDate(message.date_scheduled);
            return (
              <div key={jobId} className="relative border rounded-lg p-4 bg-white shadow-md">
                <button
                  className="absolute top-2 right-2 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                  onClick={() => handleDeleteMessage(jobId)}
                  aria-label="Delete message"
                >
                  X
                </button>
                <h3 className="text-lg font-semibold">{message.title}</h3>
                <p className="text-gray-700">{message.message}</p>
                <p className="text-sm text-gray-500 mt-2">By: {message.displayName}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Scheduled: {date} at {time}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-gray-500 mt-12">
          <p className="text-lg font-medium mb-2">No messages scheduled.</p>
          <p>Go to the home page to schedule your next message.</p>
        </div>
      )}

      {/* Back arrow button to return to the home page */}
      <button
        className="absolute top-4 left-4 text-[#001F3F] hover:bg-[#001F3F]/10 rounded-full p-2 transition-colors duration-200"
        onClick={() => navigate("/")}
        aria-label="Go back"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-6 w-6"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
    </div>
  );
};

export default ScheduledMessages;
