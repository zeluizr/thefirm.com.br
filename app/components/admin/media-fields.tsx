import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Switch } from '~/components/ui/switch'
import { Textarea } from '~/components/ui/textarea'
import { toDateTimeLocal } from '~/lib/format'
import { ALL_PLATFORMS, DEFAULT_PERSONA, PLATFORM_LABELS, type MediaItem } from '~/services/types'

// Shared field set for both "create" and "edit" media forms. The parent route
// supplies the <Form> wrapper, submit buttons and (for create) the file input.
export function MediaFields({ item }: { item?: MediaItem }) {
  const selected = new Set(item?.platforms ?? [])

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          name="title"
          defaultValue={item?.title}
          required
          maxLength={200}
          placeholder="Fragmento 001 — sinal de teste"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="caption">Legenda</Label>
        <Textarea
          id="caption"
          name="caption"
          rows={5}
          defaultValue={item?.caption}
          placeholder="O texto que acompanha a mídia nas redes…"
        />
      </div>

      <div className="grid gap-6 bp:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="mediaType">Tipo de mídia</Label>
          <Select name="mediaType" defaultValue={item?.media_type ?? 'image'}>
            <SelectTrigger id="mediaType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="image">Imagem</SelectItem>
              <SelectItem value="video">Vídeo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="publishAt">Agendar para</Label>
          <Input
            id="publishAt"
            name="publishAt"
            type="datetime-local"
            defaultValue={toDateTimeLocal(item?.publish_at)}
          />
          <p className="text-xs text-muted-foreground">
            Vazio = publica assim que for marcado como pronto.
          </p>
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Plataformas</Label>
        <div className="flex flex-wrap gap-2">
          {ALL_PLATFORMS.map((p) => (
            <label
              key={p}
              className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/15 has-[:checked]:text-primary"
            >
              <input
                type="checkbox"
                name="platforms"
                value={p}
                defaultChecked={selected.has(p)}
                className="size-4 accent-primary"
              />
              {PLATFORM_LABELS[p]}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="persona">Persona</Label>
        <Input id="persona" name="persona" defaultValue={item?.persona ?? DEFAULT_PERSONA} />
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-secondary/30 p-4">
        <div className="grid gap-1">
          <Label htmlFor="retain">Manter mídia após publicar</Label>
          <p className="text-xs text-muted-foreground">
            Se desligado, a mídia é apagada do bucket após sucesso completo.
          </p>
        </div>
        <Switch
          id="retain"
          name="retain"
          defaultChecked={item?.retain_media_after_publish ?? true}
        />
      </div>
    </div>
  )
}
