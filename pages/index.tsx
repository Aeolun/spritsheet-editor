import type { NextPage } from "next";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  VStack,
} from "@chakra-ui/react";
import { useDropzone } from "react-dropzone";
import {
  MouseEventHandler,
  ReactNode,
  useCallback,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { Area } from "../lib/Area";

const Frames = (props: {
  columns: number;
  rows: number;
  width: number;
  color: string;
}) => {
  const columns: ReactNode[] = [];
  for (let j = 0; j < props.columns; j++) {
    columns.push(
      <Box
        flex={1}
        height={"100%"}
        borderWidth={props.width}
        borderColor={props.color}
        opacity={0.5}
        borderStyle={"solid"}
      ></Box>
    );
  }
  const rows: ReactNode[] = [];
  for (let i = 0; i < props.rows; i++) {
    rows.push(
      <Flex gap={0} flex={1} width={"100%"}>
        {columns}
      </Flex>
    );
  }
  return (
    <Flex flexDirection={"column"} flex={1}>
      {rows}
    </Flex>
  );
};

const Home: NextPage = () => {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [preview, setPreview] = useState("");
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [snap, setSnap] = useState({ x: 1, y: 1 });
  const [zoomFactor, setZoomFactor] = useState(1);
  const [image, setImage] = useState<
    | {
        name: string;
        data: string;
      }
    | undefined
  >({ name: "", data: "" });

  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<number | undefined>(
    undefined
  );

  const onDrop = useCallback((acceptedFiles) => {
    // Do something with the files
    acceptedFiles.forEach((file) => {
      console.log(file);
      const existingData = localStorage.getItem("filedata_" + file.name);
      if (existingData) {
        const jsonData = JSON.parse(existingData);
        if (jsonData.areas && jsonData.snap) {
          setAreas(jsonData.areas);
          setSnap(jsonData.snap);
        }
      }
      const reader = new FileReader();

      reader.onabort = () => console.log("file reading was aborted");
      reader.onerror = () => console.log("file reading has failed");
      reader.onload = () => {
        // Do whatever you want with the file contents
        const binaryStr = reader.result;
        if (typeof binaryStr === "string") {
          setImage({
            name: file.name,
            data: binaryStr,
          });
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const [captureArea, setCaptureArea] = useState<
    | {
        x: number;
        y: number;
        width: number;
        height: number;
      }
    | undefined
  >(undefined);
  const startCapture: MouseEventHandler<HTMLDivElement> = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCaptureArea({
      x:
        Math.floor((e.clientX - rect.left) / zoomFactor / snap.x) *
        zoomFactor *
        snap.x,
      y:
        Math.floor((e.clientY - rect.top) / zoomFactor / snap.y) *
        zoomFactor *
        snap.y,
      width: 0,
      height: 0,
    });
  };

  const duringCapture: MouseEventHandler<HTMLDivElement> = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    if (captureArea) {
      console.log({
        captureAreaX: captureArea.x,
        currentX,
        captureAreaY: captureArea.y,
        currentY,
      });
      setCaptureArea({
        ...captureArea,
        width:
          Math.ceil((currentX - captureArea.x) / zoomFactor / snap.x) *
          zoomFactor *
          snap.x,
        height:
          Math.ceil((currentY - captureArea.y) / zoomFactor / snap.y) *
          zoomFactor *
          snap.y,
      });
    }
  };

  const endCapture: MouseEventHandler<HTMLDivElement> = (e) => {
    if (captureArea) {
      const newArea = {
        id: Date.now(),
        x: Math.round(captureArea.x / zoomFactor),
        y: Math.round(captureArea.y / zoomFactor),
        width: Math.round(captureArea.width / zoomFactor),
        height: Math.round(captureArea.height / zoomFactor),
        framesX: 1,
        framesY: 1,
        name: "area" + Math.round(Math.random() * 10000),
      };
      setAreas([...areas, newArea]);
      setSelectedArea(newArea.id);
    }
    setCaptureArea(undefined);
  };

  const selectedAreaObject = areas.find((area) => area.id === selectedArea);

  const editActiveArea = (property: string, value: number | string) => {
    setAreas(
      areas.map((area) => {
        if (area.id === selectedArea) {
          return {
            ...area,
            [property]: value,
          };
        } else {
          return area;
        }
      })
    );
  };

  return (
    <Flex maxHeight={"100%"} overflow={"hidden"}>
      <Box minWidth={"200px"} background={"green.200"}>
        {!image ? (
          <div
            {...getRootProps()}
            style={{ height: "100%", padding: "30px 20px" }}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Drop the files here ...</p>
            ) : (
              <p>Drag 'n' drop some files here, or click to select files</p>
            )}
          </div>
        ) : (
          <Flex flexDirection={"column"}>
            <Box
              bg={"purple.500"}
              position={"relative"}
              onMouseDown={startCapture}
              onMouseUp={endCapture}
              onMouseMove={duringCapture}
              onMouseLeave={endCapture}
              cursor={"crosshair"}
            >
              <img
                ref={imageRef}
                src={image.data}
                onLoad={(event) => {
                  setImageSize({
                    width: event.currentTarget.width,
                    height: event.currentTarget.height,
                  });
                }}
                style={
                  zoomFactor !== 1
                    ? {
                        width: imageSize.width * zoomFactor,
                        height: imageSize.height * zoomFactor,
                        pointerEvents: "none",
                        imageRendering: "crisp-edges",
                      }
                    : { pointerEvents: "none", imageRendering: "crisp-edges" }
                }
              />
              {captureArea ? (
                <Box
                  top={captureArea.y + "px"}
                  left={captureArea.x + "px"}
                  width={captureArea.width + "px"}
                  height={captureArea.height + "px"}
                  borderStyle={"dashed"}
                  borderColor={"red.500"}
                  borderWidth={zoomFactor}
                  position={"absolute"}
                ></Box>
              ) : null}
              {areas.map((area) => {
                return (
                  <Box
                    cursor={"pointer"}
                    top={area.y * zoomFactor + "px"}
                    left={area.x * zoomFactor + "px"}
                    width={area.width * zoomFactor + "px"}
                    height={area.height * zoomFactor + "px"}
                    display={"flex"}
                    position={"absolute"}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedArea(area.id);
                    }}
                  >
                    <Frames
                      color={area.id === selectedArea ? "red.600" : "green.500"}
                      rows={area.framesY}
                      columns={area.framesX}
                      width={zoomFactor}
                    />
                  </Box>
                );
              })}
            </Box>
            <Box>
              <Button
                onClick={() => {
                  setImage(undefined);
                  setAreas([]);
                  setZoomFactor(1);
                }}
              >
                Reset
              </Button>
              <Button
                onClick={() => {
                  setZoomFactor(zoomFactor + 1);
                }}
              >
                Zoom In
              </Button>
              {zoomFactor > 1 ? (
                <Button
                  onClick={() => {
                    setZoomFactor(zoomFactor - 1);
                  }}
                >
                  Zoom Out
                </Button>
              ) : null}
              <Button
                colorScheme={"green"}
                onClick={() => {
                  localStorage.setItem(
                    "filedata_" + image.name,
                    JSON.stringify({
                      areas,
                      snap,
                    })
                  );
                }}
              >
                Save
              </Button>
            </Box>
            <HStack>
              <FormControl>
                <FormLabel>Snap X</FormLabel>
                <Input
                  value={snap.x}
                  onChange={(e) => {
                    setSnap({
                      ...snap,
                      x: parseInt(e.currentTarget.value),
                    });
                  }}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Snap Y</FormLabel>
                <Input
                  value={snap.y}
                  onChange={(e) => {
                    setSnap({
                      ...snap,
                      y: parseInt(e.currentTarget.value),
                    });
                  }}
                />
              </FormControl>
            </HStack>
          </Flex>
        )}
      </Box>
      <Box flex={1} overflow={"auto"}>
        <VStack
          borderBottom={"1px solid black"}
          maxHeight={"300px"}
          overflow={"auto"}
        >
          {areas.map((area) => {
            return (
              <Flex
                p={2}
                cursor={"pointer"}
                width={"100%"}
                justifyContent={"space-between"}
                bg={selectedArea === area.id ? "red.200" : undefined}
                onClick={() => {
                  setSelectedArea(area.id);
                }}
              >
                {area.name}{" "}
                <Button
                  colorScheme={"red"}
                  onClick={() => {
                    setAreas(
                      areas.filter((fa) => {
                        return fa.id !== area.id;
                      })
                    );
                  }}
                >
                  Delete
                </Button>
              </Flex>
            );
          })}
        </VStack>
        {selectedAreaObject ? (
          <Box p={4}>
            <FormControl>
              <FormLabel>Name</FormLabel>
              <Input
                value={selectedAreaObject.name}
                onChange={(e) => {
                  editActiveArea("name", e.currentTarget.value);
                }}
              />
            </FormControl>
            <FormControl>
              <FormLabel>X</FormLabel>
              <Input
                type={"number"}
                value={selectedAreaObject.x}
                onChange={(e) => {
                  editActiveArea("x", parseInt(e.currentTarget.value));
                }}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Y</FormLabel>
              <Input
                type={"number"}
                value={selectedAreaObject.y}
                onChange={(e) => {
                  editActiveArea("y", parseInt(e.currentTarget.value));
                }}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Width</FormLabel>
              <Input
                type={"number"}
                value={selectedAreaObject.width}
                onChange={(e) => {
                  editActiveArea("width", parseInt(e.currentTarget.value));
                }}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Height</FormLabel>
              <Input
                type={"number"}
                value={selectedAreaObject.height}
                onChange={(e) => {
                  editActiveArea("height", parseInt(e.currentTarget.value));
                }}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Frames X</FormLabel>
              <Input
                type={"number"}
                value={selectedAreaObject.framesX}
                onChange={(e) => {
                  editActiveArea("framesX", parseInt(e.currentTarget.value));
                }}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Frames Y</FormLabel>
              <Input
                type={"number"}
                value={selectedAreaObject.framesY}
                onChange={(e) => {
                  editActiveArea("framesY", parseInt(e.currentTarget.value));
                }}
              />
            </FormControl>
            <Button
              onClick={() => {
                if (image) {
                  axios
                    .post("/api/animate", {
                      base: image.data,
                      area: selectedAreaObject,
                    })
                    .then((result) => {
                      setPreview(result.data);
                    });
                }
              }}
            >
              Preview
            </Button>
            {preview ? (
              <img
                style={{
                  height: selectedAreaObject.height * zoomFactor,
                  imageRendering: "crisp-edges",
                }}
                src={preview}
              />
            ) : undefined}
          </Box>
        ) : null}
      </Box>
    </Flex>
  );
};

export default Home;
