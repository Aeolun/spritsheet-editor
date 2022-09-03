import type { NextPage } from "next";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Img,
  Input,
  Select,
  VStack,
} from "@chakra-ui/react";
import { useDropzone } from "react-dropzone";
import {
  MouseEventHandler,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { SelectedArea } from "../store/selectors/SelectedArea";
import { tileActions } from "../store/tile/slice";
import { useAppDispatch, useAppSelector } from "../store/Hooks";
import { SelectedAnimation } from "../store/selectors/SelectedAnimation";

const availableCategories = ["ship", "bullet", "drop"];

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
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [categorySelector, setCategorySelector] = useState("");

  const preview = useAppSelector((state) => state.tile.animationPreview);
  const frameImages = useAppSelector((state) => state.tile.frameImages);
  const snap = useAppSelector((state) => state.tile.snap);
  const areas = useAppSelector((state) => state.tile.areas);
  const selectedAnimation = useAppSelector(SelectedAnimation);
  const selectedArea = useAppSelector(SelectedArea);
  const image = useAppSelector((state) => state.tile.image);
  const zoomFactor = useAppSelector((state) => state.tile.zoomLevel);
  const dispatch = useAppDispatch();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Do something with the files
    acceptedFiles.forEach((file) => {
      console.log(file);
      const existingData = localStorage.getItem("filedata_" + file.name);
      if (existingData) {
        const jsonData = JSON.parse(existingData);
        if (jsonData.areas && jsonData.snap) {
          dispatch(tileActions.setAreas(jsonData.areas));
          dispatch(tileActions.setSnap(jsonData.snap));
        }
      }
      const reader = new FileReader();

      reader.onabort = () => console.log("file reading was aborted");
      reader.onerror = () => console.log("file reading has failed");
      reader.onload = () => {
        // Do whatever you want with the file contents
        const binaryStr = reader.result;
        if (typeof binaryStr === "string") {
          dispatch(
            tileActions.setImage({
              name: file.name,
              data: binaryStr,
            })
          );
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  useEffect(() => {
    if (image) {
      axios
        .post("/api/split", {
          base: image.data,
          area: selectedArea,
        })
        .then((result) => {
          dispatch(tileActions.setFrameImages(result.data));
        });
    }
  }, [selectedArea]);

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
        category: "",
        id: Date.now(),
        x: Math.round(captureArea.x / zoomFactor),
        y: Math.round(captureArea.y / zoomFactor),
        width: Math.round(captureArea.width / zoomFactor),
        height: Math.round(captureArea.height / zoomFactor),
        framesX: 1,
        framesY: 1,
        name: "area" + Math.round(Math.random() * 10000),
        animations: [],
      };
      dispatch(tileActions.addArea(newArea));
      dispatch(tileActions.selectArea(newArea.id));
    }
    setCaptureArea(undefined);
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
                    width: event.currentTarget.naturalWidth,
                    height: event.currentTarget.naturalHeight,
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
                      dispatch(tileActions.selectArea(area.id));
                    }}
                  >
                    <Frames
                      color={
                        area.id === selectedArea?.id ? "red.600" : "green.500"
                      }
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
                  dispatch(tileActions.setImage(undefined));
                  dispatch(tileActions.setAreas([]));
                  dispatch(tileActions.setZoomLevel(1));
                }}
              >
                Reset
              </Button>
              <Button
                onClick={() => {
                  dispatch(tileActions.increaseZoomLevel());
                }}
              >
                Zoom In
              </Button>
              {zoomFactor > 1 ? (
                <Button
                  onClick={() => {
                    dispatch(tileActions.decreaseZoomLevel());
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
                  axios.post("/api/save", {
                    file: image.name,
                    areas,
                  });
                }}
              >
                Save
              </Button>
              <Button
                colorScheme={"blue"}
                onClick={() => {
                  axios.post("/api/export", {
                    base: image.data,
                    areas: areas,
                  });
                }}
              >
                Export
              </Button>
              <Button
                colorScheme={"blue"}
                onClick={() => {
                  axios.post("/api/generate-spritesheet", {});
                }}
              >
                Spritesheet
              </Button>
              <Select
                value={categorySelector || ""}
                onChange={(e) => {
                  setCategorySelector(e.currentTarget.value);
                }}
              >
                <option value={""}>-- please select --</option>
                {availableCategories.map((c) => {
                  return <option>{c}</option>;
                })}
              </Select>
              <Button
                onClick={() => {
                  areas.forEach((area) => {
                    dispatch(
                      tileActions.modifyArea({
                        id: area.id,
                        values: {
                          category: categorySelector,
                        },
                      })
                    );
                  });
                }}
              >
                Set All
              </Button>
            </Box>
            <HStack>
              <FormControl>
                <FormLabel>Snap X</FormLabel>
                <Input
                  value={snap.x}
                  onChange={(e) => {
                    dispatch(
                      tileActions.setSnap({
                        ...snap,
                        x: parseInt(e.currentTarget.value),
                      })
                    );
                  }}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Snap Y</FormLabel>
                <Input
                  value={snap.y}
                  onChange={(e) => {
                    dispatch(
                      tileActions.setSnap({
                        ...snap,
                        y: parseInt(e.currentTarget.value),
                      })
                    );
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
                bg={selectedArea?.id === area.id ? "red.200" : undefined}
                onClick={() => {
                  dispatch(tileActions.selectArea(area.id));
                }}
              >
                {area.category ? area.category + " - " : ""}
                {area.name}{" "}
                <Button
                  colorScheme={"red"}
                  onClick={() => {
                    dispatch(tileActions.deleteArea(area.id));
                  }}
                >
                  Delete
                </Button>
              </Flex>
            );
          })}
        </VStack>
        {selectedArea ? (
          <Box p={4}>
            <FormControl>
              <FormLabel>Category</FormLabel>
              <Select
                value={selectedArea.category || ""}
                onChange={(e) => {
                  dispatch(
                    tileActions.modifySelectedArea({
                      category: e.currentTarget.value,
                    })
                  );
                }}
              >
                <option value={""}>-- please select --</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Name</FormLabel>
              <Input
                value={selectedArea.name}
                onChange={(e) => {
                  dispatch(
                    tileActions.modifySelectedArea({
                      name: e.currentTarget.value,
                    })
                  );
                }}
              />
            </FormControl>
            <FormControl>
              <FormLabel>X</FormLabel>
              <Input
                type={"number"}
                value={selectedArea.x}
                onChange={(e) => {
                  dispatch(
                    tileActions.modifySelectedArea({
                      x: parseInt(e.currentTarget.value),
                    })
                  );
                }}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Y</FormLabel>
              <Input
                type={"number"}
                value={selectedArea.y}
                onChange={(e) => {
                  dispatch(
                    tileActions.modifySelectedArea({
                      y: parseInt(e.currentTarget.value),
                    })
                  );
                }}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Width</FormLabel>
              <Input
                type={"number"}
                value={selectedArea.width}
                onChange={(e) => {
                  dispatch(
                    tileActions.modifySelectedArea({
                      width: parseInt(e.currentTarget.value),
                    })
                  );
                }}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Height</FormLabel>
              <Input
                type={"number"}
                value={selectedArea.height}
                onChange={(e) => {
                  dispatch(
                    tileActions.modifySelectedArea({
                      height: parseInt(e.currentTarget.value),
                    })
                  );
                }}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Frames X</FormLabel>
              <Input
                type={"number"}
                value={selectedArea.framesX}
                onChange={(e) => {
                  dispatch(
                    tileActions.modifySelectedArea({
                      framesX: parseInt(e.currentTarget.value),
                    })
                  );
                }}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Frames Y</FormLabel>
              <Input
                type={"number"}
                value={selectedArea.framesY}
                onChange={(e) => {
                  dispatch(
                    tileActions.modifySelectedArea({
                      framesY: parseInt(e.currentTarget.value),
                    })
                  );
                }}
              />
            </FormControl>

            <Heading>Animations</Heading>
            {frameImages && frameImages.length > 0 ? (
              <HStack>
                {frameImages.map((image, index) => (
                  <Box
                    borderStyle={"solid"}
                    position={"relative"}
                    borderWidth={1}
                    borderColor={
                      selectedAnimation?.frames.includes(index)
                        ? "red.500"
                        : "black"
                    }
                    p={2}
                    cursor={"pointer"}
                    onClick={() => {
                      dispatch(tileActions.toggleFrameForAnimation(index));
                    }}
                  >
                    <Img
                      style={{
                        height:
                          (selectedArea.height / selectedArea.framesY) *
                          zoomFactor,
                        imageRendering: "crisp-edges",
                      }}
                      src={image}
                    />
                    {selectedAnimation?.frames.includes(index) ? (
                      <Box
                        position={"absolute"}
                        bottom={0}
                        right={0}
                        p={1}
                        bg={"white"}
                        border={"1px solid red"}
                      >
                        {selectedAnimation?.frames.indexOf(index)}
                      </Box>
                    ) : null}
                  </Box>
                ))}
              </HStack>
            ) : null}
            <VStack>
              {selectedArea.animations?.map((anim) => {
                return (
                  <Flex
                    justifyContent={"space-between"}
                    p={2}
                    w={"100%"}
                    cursor={"pointer"}
                    onClick={() => {
                      dispatch(tileActions.selectAnimation(anim.id));
                    }}
                    background={
                      anim.id === selectedAnimation?.id ? "red.200" : undefined
                    }
                  >
                    {anim.name}
                    <Button
                      colorScheme={"red"}
                      onClick={() => {
                        dispatch(tileActions.deleteAnimation(anim.id));
                      }}
                    >
                      Delete
                    </Button>
                  </Flex>
                );
              })}
            </VStack>
            {selectedAnimation ? (
              <FormControl>
                <FormLabel>Name</FormLabel>
                <Input
                  value={selectedAnimation.name}
                  onChange={(e) => {
                    dispatch(
                      tileActions.modifySelectedAnimation({
                        name: e.currentTarget.value,
                      })
                    );
                  }}
                />
              </FormControl>
            ) : null}
            <Button
              onClick={() => {
                const animationId = Date.now();
                const animationName =
                  "animation" + Math.round(Math.random() * 1000);
                dispatch(
                  tileActions.addAnimation({
                    id: animationId,
                    name: animationName,
                    frames: [],
                  })
                );
                dispatch(tileActions.selectAnimation(animationId));
              }}
              colorScheme={"green"}
            >
              Add animation
            </Button>
            {preview ? (
              <img
                style={{
                  height:
                    (selectedArea.height / selectedArea.framesY) * zoomFactor,
                  imageRendering: "crisp-edges",
                }}
                src={preview}
              />
            ) : undefined}
            {selectedAnimation ? (
              <Button
                onClick={() => {
                  if (image) {
                    axios
                      .post("/api/animate", {
                        base: image.data,
                        area: selectedArea,
                        animation: selectedAnimation.name,
                      })
                      .then((result) => {
                        dispatch(tileActions.setAnimationPreview(result.data));
                      });
                  }
                }}
              >
                Preview Animation ({selectedAnimation.name})
              </Button>
            ) : null}
          </Box>
        ) : null}
      </Box>
    </Flex>
  );
};

export default Home;
