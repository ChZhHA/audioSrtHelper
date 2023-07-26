import "./App.css";
import { useMemo, useRef, useState } from "react";
import { Importer } from "./importor";

function App() {
    const audioPlayer = useRef<HTMLAudioElement>(null);
    const playerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const [audioSrc, setAudioSrc] = useState("");
    const [srtSrc, setSrtSrc] = useState("");
    const [playing, setPlaying] = useState(false);
    const [isDrag, setIsDrag] = useState(false);
    const [duration, setDuration] = useState(0);
    const [current, setCurrent] = useState(0);
    const [tempCurrent, setTempCurrent] = useState(-1);
    const data = useRef({
        isDrag: false,
        duration: 0,
    });
    const dragProgress = (e: MouseEvent) => {
        const rect = playerRef.current!.getBoundingClientRect();
        const rate = (e.clientX - rect.x) / rect.width;
        const current = rate * data.current.duration;
        setCurrent(current);
        audioPlayer.current!.currentTime = current;
    };
    const releaseDrag = (e: MouseEvent) => {
        if (e.button === 0) {
            window.removeEventListener("mousemove", dragProgress);
            window.removeEventListener("mouseup", releaseDrag);
            setIsDrag(false);
            data.current.isDrag = false;
            if (playing) {
                audioPlayer.current?.play();
            }
        }
    };
    const getTimeFormat = (time: number) => {
        return `${Math.floor(time / 60)}'
        ${Math.floor(time % 60)}''`;
    };

    const getSecond = (timeStr: string) => {
        const timeArr = timeStr.split(":");
        const hour = +timeArr[0];
        const minute = +timeArr[1];
        const secondArr = timeArr[2].split(",");
        const second = +secondArr[0] + parseInt(secondArr[1]) * 0.001;
        return (hour * 60 + minute) * 60 + second;
    };

    const srt = useMemo(() => {
        const srt = srtSrc.split("\r\n").filter((item) => item.length > 0);
        const result: {
            text: string;
            start: number;
            end: number;
            duration: number;
        }[] = [];
        for (let index = 0; index < srt.length; index += 3) {
            const _range = srt[index + 1].split(" --> ");
            const start = getSecond(_range[0]);
            const end = getSecond(_range[1]);
            result.push({
                text: srt[index + 2],
                start,
                end,
                duration: end - start,
            });
        }
        return result;
        // console.log(srt);
    }, [srtSrc]);

    return (
        <div className="App">
            <Importer setAudioSrc={setAudioSrc} setSrtSrc={setSrtSrc} />
            <audio
                hidden
                src={audioSrc}
                autoPlay={false}
                ref={audioPlayer}
                onLoadedMetadata={(e) => {
                    console.log(e);
                    setDuration(e.currentTarget.duration);
                    data.current.duration = e.currentTarget.duration;
                }}
                onTimeUpdate={(e) => {
                    const currentTime = e.currentTarget.currentTime;
                    setCurrent(currentTime);
                    const targetIndex = srt.findIndex(
                        (item) =>
                            item.start <= currentTime && item.end >= currentTime
                    );
                    if (targetIndex > -1) {
                        listRef.current!.children[targetIndex].scrollIntoView({
                            behavior: "smooth",
                        });
                    }
                }}
            ></audio>
            <div>
                <div className="cover">
                    <div
                        onClick={() => {
                            if (audioSrc.length > 0) {
                                if (playing) {
                                    audioPlayer.current?.pause();
                                } else {
                                    audioPlayer.current?.play();
                                }
                                setPlaying(!playing);
                            }
                        }}
                        className="control"
                    >
                        <div className="button-play" hidden={playing}>
                            播放
                        </div>
                        <div className="button-pause" hidden={!playing}>
                            暂停
                        </div>
                    </div>
                    <div
                        className="player"
                        data-enable={audioSrc.length > 0 ? "1" : "0"}
                        ref={playerRef}
                        onMouseDown={(e) => {
                            if (e.button === 0) {
                                if (!data.current.isDrag) {
                                    data.current.isDrag = true;
                                    setIsDrag(true);
                                    window.addEventListener(
                                        "mousemove",
                                        dragProgress
                                    );
                                    window.addEventListener(
                                        "mouseup",
                                        releaseDrag
                                    );
                                    const rect =
                                        e.currentTarget.getBoundingClientRect();
                                    const rate =
                                        (e.clientX - rect.x) / rect.width;
                                    const current =
                                        rate * data.current.duration;
                                    setCurrent(current);
                                    audioPlayer.current!.currentTime = current;
                                    audioPlayer.current?.pause();
                                }
                            }
                        }}
                        onMouseMove={(e) => {
                            if (!data.current.isDrag) {
                                const rect =
                                    e.currentTarget.getBoundingClientRect();
                                const rate = (e.clientX - rect.x) / rect.width;
                                setTempCurrent(rate * data.current.duration);
                            }
                        }}
                        onMouseOut={() => {
                            if (!data.current.isDrag) {
                                setTempCurrent(-1);
                            }
                        }}
                    >
                        <div
                            className="progress"
                            style={{
                                width: (current / duration) * 100 + "%",
                            }}
                        ></div>
                        {srt.map((item, index) => {
                            const enable =
                                item.start <= current && item.end >= current;
                            return (
                                <div
                                    key={index}
                                    className="item"
                                    data-enable={enable ? 1 : 0}
                                    style={{
                                        left:
                                            (item.start / duration) * 100 + "%",
                                        width:
                                            (item.duration / duration) * 100 +
                                            "%",
                                    }}
                                ></div>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <span style={{ width: 120, marginLeft: 15 }}>
                        {getTimeFormat(
                            tempCurrent >= 0 ? tempCurrent : current
                        )}
                    </span>
                    <span style={{ marginLeft: 15 }}>
                        /{getTimeFormat(duration)}
                    </span>
                </div>
                <div className="list" ref={listRef}>
                    {srt.map((item, index) => {
                        const enable =
                            item.start <= current && item.end >= current;
                        return (
                            <div
                                key={index}
                                className="item"
                                data-enable={enable ? 1 : 0}
                                onClick={() => {
                                    audioPlayer.current!.currentTime =
                                        item.start;
                                    setCurrent(item.start + 0.0000001);
                                }}
                            >
                                <span
                                    style={{
                                        width: 80,
                                        display: "inline-block",
                                    }}
                                >
                                    {getTimeFormat(item.start)}
                                </span>
                                <span style={{ marginLeft: 5 }}>
                                    {item.text}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default App;
