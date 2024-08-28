import React, { useState, useEffect, useCallback } from 'react';
import { Mic, Save, Pin, Trash2 } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Alert, AlertDescription } from './components/ui/alert';
import { v4 as uuid } from 'uuid';

const VoiceNotesApp = () => {
  const [notes, setNotes] = useState<Array<{ id: string; title: string; text: string; createdAt: Date; pinned: boolean }>>([]);
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

  useEffect(() => {
    const storedNotes = localStorage.getItem('voiceNotes');
    if (storedNotes) {
      setNotes(JSON.parse(storedNotes).map((note: any) => ({
        ...note,
        createdAt: new Date(note.createdAt)
      })));
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
      const noteText = transcript.trim();
      const newNote = {
        id: uuid(),
        title: noteText.slice(0, 15) + (noteText.length > 15 ? '...' : ''),
        text: noteText,
        createdAt: new Date(),
        pinned: false
      };
      setNotes((prevNotes) => {
        const updatedNotes = [...prevNotes, newNote];
        localStorage.setItem('voiceNotes', JSON.stringify(updatedNotes));
        return updatedNotes;
      });
      setTranscript('');
    }
  }, [transcript]);

  const togglePinNote = useCallback((id: string) => {
    setNotes((prevNotes) => {
      const updatedNotes = prevNotes.map(note =>
        note.id === id ? { ...note, pinned: !note.pinned } : note
      );
      localStorage.setItem('voiceNotes', JSON.stringify(updatedNotes));
      return updatedNotes;
    });
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prevNotes) => {
      const updatedNotes = prevNotes.filter(note => note.id !== id);
      localStorage.setItem('voiceNotes', JSON.stringify(updatedNotes));
      return updatedNotes;
    });
  }, []);

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Voice Notes</h1>
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
        {notes
          .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
          .map((note) => (
            <Card key={note.id} className="mb-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{note.title}</CardTitle>
                  <div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => togglePinNote(note.id)}
                      className="mr-2"
                    >
                      <Pin className={note.pinned ? "text-primary" : "text-muted-foreground"} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteNote(note.id)}
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {note.createdAt ? note.createdAt.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Date not available'}
                </p>
              </CardHeader>
              <CardContent>{note.text}</CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
};

export default VoiceNotesApp;