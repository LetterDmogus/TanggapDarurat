import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { useEffect, useMemo, useRef, useState } from 'react';

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function createEntry(file, index) {
    return {
        id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
        originalFile: file,
        currentFile: file,
        previewUrl: URL.createObjectURL(file),
        error: '',
    };
}

function createImage(file) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        const objectUrl = URL.createObjectURL(file);
        image.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(image);
        };
        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Gagal membaca gambar.'));
        };
        image.src = objectUrl;
    });
}

function rotateSize(width, height, rotation) {
    const radians = (rotation * Math.PI) / 180;
    return {
        width: Math.abs(Math.cos(radians) * width) + Math.abs(Math.sin(radians) * height),
        height: Math.abs(Math.sin(radians) * width) + Math.abs(Math.cos(radians) * height),
    };
}

async function cropImageToFile(file, croppedAreaPixels, rotation) {
    const image = await createImage(file);
    const radians = (rotation * Math.PI) / 180;
    const bounds = rotateSize(image.width, image.height, rotation);

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('Canvas tidak tersedia.');
    }

    canvas.width = Math.floor(bounds.width);
    canvas.height = Math.floor(bounds.height);

    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate(radians);
    context.drawImage(image, -image.width / 2, -image.height / 2);

    const cropX = clamp(Math.floor(croppedAreaPixels.x), 0, canvas.width - 1);
    const cropY = clamp(Math.floor(croppedAreaPixels.y), 0, canvas.height - 1);
    const cropWidth = clamp(Math.floor(croppedAreaPixels.width), 1, canvas.width - cropX);
    const cropHeight = clamp(Math.floor(croppedAreaPixels.height), 1, canvas.height - cropY);

    const imageData = context.getImageData(cropX, cropY, cropWidth, cropHeight);
    const outputCanvas = document.createElement('canvas');
    const outputContext = outputCanvas.getContext('2d');
    if (!outputContext) {
        throw new Error('Canvas tidak tersedia.');
    }

    outputCanvas.width = cropWidth;
    outputCanvas.height = cropHeight;
    outputContext.putImageData(imageData, 0, 0);

    const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const blob = await new Promise((resolve, reject) => {
        outputCanvas.toBlob(
            (result) => {
                if (!result) {
                    reject(new Error('Gagal memproses gambar.'));
                    return;
                }
                resolve(result);
            },
            outputType,
            0.92,
        );
    });

    const extension = outputType === 'image/png' ? 'png' : 'jpg';
    const safeBaseName = file.name.replace(/\.[^/.]+$/, '');
    const nextName = `${safeBaseName}-edited.${extension}`;

    return new File([blob], nextName, {
        type: outputType,
        lastModified: Date.now(),
    });
}

export default function ImageEditorUploader({
    label,
    helperText,
    errorText,
    multiple = true,
    resetToken = 0,
    onChange,
}) {
    const [entries, setEntries] = useState([]);
    const [editorState, setEditorState] = useState({
        isOpen: false,
        entryId: null,
        imageUrl: '',
        crop: { x: 0, y: 0 },
        zoom: 1,
        rotation: 0,
        croppedAreaPixels: null,
        isSaving: false,
        error: '',
    });
    const inputRef = useRef(null);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        return () => {
            entries.forEach((entry) => URL.revokeObjectURL(entry.previewUrl));
            if (editorState.imageUrl) {
                URL.revokeObjectURL(editorState.imageUrl);
            }
        };
    }, [entries, editorState.imageUrl]);

    useEffect(() => {
        setEntries((prev) => {
            prev.forEach((entry) => URL.revokeObjectURL(entry.previewUrl));
            return [];
        });

        setEditorState((prev) => {
            if (prev.imageUrl) {
                URL.revokeObjectURL(prev.imageUrl);
            }
            return {
                isOpen: false,
                entryId: null,
                imageUrl: '',
                crop: { x: 0, y: 0 },
                zoom: 1,
                rotation: 0,
                croppedAreaPixels: null,
                isSaving: false,
                error: '',
            };
        });

        if (inputRef.current) {
            inputRef.current.value = '';
        }

        onChangeRef.current?.([]);
    }, [resetToken]);

    const files = useMemo(() => entries.map((entry) => entry.currentFile), [entries]);

    useEffect(() => {
        onChangeRef.current?.(files);
    }, [files]);

    const closeEditor = () => {
        setEditorState((prev) => {
            if (prev.imageUrl) {
                URL.revokeObjectURL(prev.imageUrl);
            }
            return {
                isOpen: false,
                entryId: null,
                imageUrl: '',
                crop: { x: 0, y: 0 },
                zoom: 1,
                rotation: 0,
                croppedAreaPixels: null,
                isSaving: false,
                error: '',
            };
        });
    };

    const openEditor = (entry) => {
        const imageUrl = URL.createObjectURL(entry.currentFile);
        setEditorState({
            isOpen: true,
            entryId: entry.id,
            imageUrl,
            crop: { x: 0, y: 0 },
            zoom: 1,
            rotation: 0,
            croppedAreaPixels: null,
            isSaving: false,
            error: '',
        });
    };

    const handleFileChange = (event) => {
        const selected = Array.from(event.target.files || []);
        setEntries((prev) => {
            prev.forEach((entry) => URL.revokeObjectURL(entry.previewUrl));
            return selected.map((file, index) => createEntry(file, index));
        });
    };

    const removeEntry = (entryId) => {
        setEntries((prev) => {
            const target = prev.find((item) => item.id === entryId);
            if (target) {
                URL.revokeObjectURL(target.previewUrl);
            }
            return prev.filter((item) => item.id !== entryId);
        });
    };

    const applyEditor = async () => {
        if (!editorState.entryId || !editorState.croppedAreaPixels) {
            return;
        }

        setEditorState((prev) => ({ ...prev, isSaving: true, error: '' }));

        const entry = entries.find((item) => item.id === editorState.entryId);
        if (!entry) {
            setEditorState((prev) => ({ ...prev, isSaving: false, error: 'Foto tidak ditemukan.' }));
            return;
        }

        try {
            const nextFile = await cropImageToFile(entry.currentFile, editorState.croppedAreaPixels, editorState.rotation);
            const nextPreview = URL.createObjectURL(nextFile);

            setEntries((prev) =>
                prev.map((item) => {
                    if (item.id !== entry.id) {
                        return item;
                    }

                    URL.revokeObjectURL(item.previewUrl);
                    return {
                        ...item,
                        currentFile: nextFile,
                        previewUrl: nextPreview,
                        error: '',
                    };
                }),
            );

            closeEditor();
        } catch (error) {
            setEditorState((prev) => ({
                ...prev,
                isSaving: false,
                error: error instanceof Error ? error.message : 'Gagal memproses gambar.',
            }));
        }
    };

    const restoreOriginal = (entryId) => {
        setEntries((prev) =>
            prev.map((entry) => {
                if (entry.id !== entryId) {
                    return entry;
                }

                const nextPreview = URL.createObjectURL(entry.originalFile);
                URL.revokeObjectURL(entry.previewUrl);

                return {
                    ...entry,
                    currentFile: entry.originalFile,
                    previewUrl: nextPreview,
                    error: '',
                };
            }),
        );
    };

    return (
        <div className="space-y-2">
            {label && <label className="form-label">{label}</label>}
            <input
                ref={inputRef}
                type="file"
                className="form-input"
                multiple={multiple}
                accept="image/*"
                onChange={handleFileChange}
            />
            {helperText && <p className="text-xs text-surface-500">{helperText}</p>}
            {errorText && <p className="text-xs text-red-500">{errorText}</p>}

            {entries.length > 0 && (
                <div className="grid gap-3 pt-1 sm:grid-cols-2 lg:grid-cols-3">
                    {entries.map((entry, index) => (
                        <div key={entry.id} className="rounded-lg border border-surface-200 bg-surface-50 p-3">
                            <div className="overflow-hidden rounded-md border border-surface-200 bg-white">
                                <img src={entry.previewUrl} alt={entry.currentFile.name} className="h-36 w-full object-cover" />
                            </div>
                            <p className="mt-2 text-xs font-semibold text-surface-700">
                                Foto {index + 1}
                            </p>
                            <p className="text-[11px] text-surface-500 truncate">{entry.currentFile.name}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                                    onClick={() => openEditor(entry)}
                                >
                                    Edit
                                </button>
                                <button
                                    type="button"
                                    className="rounded-md border border-surface-300 px-3 py-1.5 text-xs font-semibold text-surface-700 hover:bg-white"
                                    onClick={() => restoreOriginal(entry.id)}
                                >
                                    Reset
                                </button>
                                <button
                                    type="button"
                                    className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                                    onClick={() => removeEntry(entry.id)}
                                >
                                    Hapus
                                </button>
                            </div>
                            {entry.error && <p className="mt-1 text-xs text-red-500">{entry.error}</p>}
                        </div>
                    ))}
                </div>
            )}

            {editorState.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="w-full max-w-4xl rounded-xl bg-white shadow-xl">
                        <div className="border-b border-surface-200 p-4">
                            <p className="text-sm font-semibold text-surface-800">Edit Gambar</p>
                            <p className="text-xs text-surface-500">Tarik area crop langsung di gambar, lalu atur zoom/rotasi.</p>
                        </div>

                        <div className="grid gap-4 p-4 md:grid-cols-[1fr,280px]">
                            <div className="relative h-[360px] overflow-hidden rounded-lg bg-black">
                                <Cropper
                                    image={editorState.imageUrl}
                                    crop={editorState.crop}
                                    zoom={editorState.zoom}
                                    rotation={editorState.rotation}
                                    aspect={4 / 3}
                                    onCropChange={(crop) => setEditorState((prev) => ({ ...prev, crop }))}
                                    onZoomChange={(zoom) => setEditorState((prev) => ({ ...prev, zoom }))}
                                    onRotationChange={(rotation) => setEditorState((prev) => ({ ...prev, rotation }))}
                                    onCropComplete={(_, croppedAreaPixels) =>
                                        setEditorState((prev) => ({ ...prev, croppedAreaPixels }))
                                    }
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="block text-xs font-semibold text-surface-700">
                                    Zoom ({editorState.zoom.toFixed(1)}x)
                                    <input
                                        type="range"
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        value={editorState.zoom}
                                        className="mt-1 w-full"
                                        onChange={(event) =>
                                            setEditorState((prev) => ({ ...prev, zoom: Number(event.target.value) }))
                                        }
                                    />
                                </label>

                                <label className="block text-xs font-semibold text-surface-700">
                                    Rotasi ({Math.round(editorState.rotation)} deg)
                                    <input
                                        type="range"
                                        min={-180}
                                        max={180}
                                        step={1}
                                        value={editorState.rotation}
                                        className="mt-1 w-full"
                                        onChange={(event) =>
                                            setEditorState((prev) => ({ ...prev, rotation: Number(event.target.value) }))
                                        }
                                    />
                                </label>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        className="rounded-md border border-surface-300 px-3 py-1.5 text-xs font-semibold text-surface-700 hover:bg-surface-50"
                                        onClick={() =>
                                            setEditorState((prev) => ({
                                                ...prev,
                                                rotation: prev.rotation - 90,
                                            }))
                                        }
                                    >
                                        Rotate -90
                                    </button>
                                    <button
                                        type="button"
                                        className="rounded-md border border-surface-300 px-3 py-1.5 text-xs font-semibold text-surface-700 hover:bg-surface-50"
                                        onClick={() =>
                                            setEditorState((prev) => ({
                                                ...prev,
                                                rotation: prev.rotation + 90,
                                            }))
                                        }
                                    >
                                        Rotate +90
                                    </button>
                                </div>

                                {editorState.error && <p className="text-xs text-red-500">{editorState.error}</p>}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-surface-200 p-4">
                            <button
                                type="button"
                                className="rounded-md border border-surface-300 px-4 py-2 text-sm font-semibold text-surface-700 hover:bg-surface-50"
                                onClick={closeEditor}
                                disabled={editorState.isSaving}
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                                onClick={applyEditor}
                                disabled={editorState.isSaving}
                            >
                                {editorState.isSaving ? 'Menyimpan...' : 'Terapkan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
