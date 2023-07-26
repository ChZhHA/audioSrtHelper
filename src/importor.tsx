import React from "react";
import { useRef, ChangeEventHandler } from "react";

export function Importer(props: {
    setSrtSrc: React.Dispatch<React.SetStateAction<string>>;
    setAudioSrc: React.Dispatch<React.SetStateAction<string>>;
}) {
    const audioInput = useRef<HTMLInputElement>(null);
    const srtInput = useRef<HTMLInputElement>(null);

    const inputChange = ((e) => {
        if (e.target.files?.[0]) {
            const url = URL.createObjectURL(e.target.files[0]);
            if (e.target.files?.[0].name.endsWith("srt")) {
                // props.setSrtSrc(url);
                const fileReader = new FileReader();
                fileReader.readAsText(e.target.files[0]);
                fileReader.onload = () => {
                    props.setSrtSrc(fileReader.result as string);
                };
            } else {
                props.setAudioSrc(url);
            }
        }
    }) as ChangeEventHandler<HTMLInputElement>;
    return (
        <div>
            <button
                onClick={() => {
                    audioInput.current?.click();
                }}
            >
                导入音频
            </button>
            <button
                onClick={() => {
                    srtInput.current?.click();
                }}
            >
                导入字幕
            </button>
            <input
                hidden
                type="file"
                accept="audio/*"
                ref={audioInput}
                onChange={inputChange}
            ></input>
            <input
                hidden
                type="file"
                accept=".srt"
                ref={srtInput}
                onChange={inputChange}
            ></input>
        </div>
    );
}
