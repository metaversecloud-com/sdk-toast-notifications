import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { backendAPI } from "@/utils";

const ScheduledMessages = () => {
  // imitates the structure of world data object in handleSetDataObjects
  const [messages, setMessages] = useState<{
    [key: string]: { title: string; message: string; date_scheduled: string };
  }>({});

  const navigate = useNavigate();

  // fetches the word data object and initializes local variable - merges all messages to include multiple admins
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await backendAPI.get("/world/handle-get-toasts");
        console.log("Response:", response.data.savedData.messages); // Debugging log
  
        // explicitly type messagesData
        const messagesData: Record<string, Record<string, { title: string; message: string; date_scheduled: string }>> =
          response.data.savedData.messages;
  
        if (messagesData && typeof messagesData === "object") {
          // merge all messages from different profile IDs into a single object
          const allMessages = Object.values(messagesData).reduce((acc, profileMessages) => {
            return { ...acc, ...profileMessages };
          }, {} as Record<string, { title: string; message: string; date_scheduled: string }>);
  
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
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const dateFormatted = date.toLocaleDateString(undefined, options); // formats to "Month Day, Year"
    const timeFormatted = date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }); // formats to "Hour:Minute"
    return { date: dateFormatted, time: timeFormatted };
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Scheduled Messages</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(messages).map(([jobId, message]) => {
          const { date, time } = formatDate(message.date_scheduled);
          return (
            <div key={jobId} className="relative border rounded-lg p-4 bg-white shadow-md">
              {/* Small Delete Button at the Top-Right */}
              <button
                className="absolute top-2 right-2 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                onClick={() => handleDeleteMessage(jobId)}
                aria-label="Delete message"
              >
                X
              </button>
              <h3 className="text-lg font-semibold">{message.title}</h3>
              <p className="text-gray-700">{message.message}</p>
              <p className="text-sm text-gray-500 mt-2">
                Scheduled: {date} at {time}
              </p>
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex justify-center">
        <button className="btn" onClick={() => navigate("/")}>
          Go Back
        </button>
      </div>
    </div>
  );
};

export default ScheduledMessages;
