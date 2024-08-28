import React, { useState, useEffect, useCallback } from 'react';
import { Mic, Save } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Alert, AlertDescription } from './components/ui/alert';


const VoiceNotesApp = () => {
  const [notes, setNotes] = useState<Array<{ id: number; text: string }>>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const newRecognition = new SpeechRecognition();
      newRecognition.continuous = true;
      newRecognition.interimResults = true;
      newRecognition.onresult = handleRecognitionResult;
      newRecognition.onerror = (event: SpeechRecognitionErrorEvent) => handleRecognitionError(event.error);
      setRecognition(newRecognition);
    } else {
      setError('Speech recognition is not supported in this browser. Please try using Google Chrome or Microsoft Edge.');
    }
  }, []);

  const handleRecognitionResult = (event: SpeechRecognitionEvent) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    setTranscript((prev) => prev + finalTranscript);
    setInterimTranscript(interimTranscript);
  };

  const handleRecognitionError = (error: string) => {
    if (error === 'not-allowed') {
      setError(`Microphone access is not allowed. This may be due to a permissions policy violation. 
                Please try the following:
                1. Ensure you're using HTTPS (even for localhost).
                2. If using Chrome, go to chrome://flags and enable "Insecure origins treated as secure", add your development URL.
                3. Restart your browser and try again.`);
    } else {
      setError(`Error: ${error}. Please ensure microphone access is allowed.`);
    }
    setIsRecording(false);
  };

  const startRecording = useCallback(async () => {
    setError('');
    try {
      if (recognition) {
        await recognition.start();
        setIsRecording(true);
        setTranscript('');
        setInterimTranscript('');
      }
    } catch (err) {
      console.error('Error starting recognition:', err);
      handleRecognitionError('not-allowed');
    }
  }, [recognition]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    if (recognition) {
      recognition.stop();
    }
  }, [recognition]);

  const saveNote = useCallback(() => {
    if (transcript.trim()) {
      setNotes((prevNotes) => [...prevNotes, { id: Date.now(), text: transcript.trim() }]);
      setTranscript('');
    }
  }, [transcript]);

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Voice Notes App</h1>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
        </Alert>
      )}
      <div className="mb-4">
        <div className="flex mb-2">
          {recognition ? (
            <Button onClick={isRecording ? stopRecording : startRecording} className="mr-2">
              {isRecording ? 'Stop Recording' : 'Start Recording'}
              <Mic className="ml-2" />
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground mr-2">Speech recognition is not available. You can type your notes manually.</p>
          )}
          <Button onClick={saveNote} disabled={!transcript.trim()}>
            Save Note
            <Save className="ml-2" />
          </Button>
        </div>
      </div>
      <div className="mb-4">
        <textarea
          value={transcript + interimTranscript}
          onChange={(e) => setTranscript(e.target.value)}
          className="w-full p-2 border rounded"
          rows={4}
          placeholder={recognition ? "Your transcription will appear here..." : "Type your note here..."}
          readOnly={isRecording}
        />
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-2">Saved Notes</h2>
        {notes.map((note) => (
          <Card key={note.id} className="mb-2">
            <CardHeader>
              <CardTitle>Note {note.id}</CardTitle>
            </CardHeader>
            <CardContent>{note.text}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VoiceNotesApp;