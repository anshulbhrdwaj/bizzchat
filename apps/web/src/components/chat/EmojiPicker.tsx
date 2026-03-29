import { useState, useRef, useEffect } from 'react'

const EMOJI_CATEGORIES = [
  {
    label: '😊', name: 'Smileys',
    emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖']
  },
  {
    label: '👋', name: 'People',
    emojis: ['👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦵','🦶','👂','🦻','👃','🧠','🦷','🦴','👀','👁','👅','👄','🫦','💋','💌','💘','💝','💖','💗','💓','💞','💕','💟','❣️','💔','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎']
  },
  {
    label: '🌍', name: 'Nature',
    emojis: ['🌸','🌺','🌻','🌹','🥀','🌷','🌱','🌿','☘️','🍀','🎋','🎍','🍃','🍂','🍁','🪺','🪹','🍄','🌾','💐','🌵','🌴','🌲','🌳','🌞','🌝','🌛','🌜','🌚','🌕','🌖','🌗','🌘','🌑','🌒','🌓','🌔','🌙','🌟','⭐','🌠','🌌','☀️','🌤','⛅','🌥','☁️','🌦','🌧','⛈','🌩','🌨','❄️','☃️','⛄','🌬','💨','💧','💦','🌊','🔥','🌪','🌫🦋','🐛','🐝','🪲','🐞','🦗','🕷','🦂','🐢','🦎','🐍','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🦣','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐈','🐓','🦃','🦤','🦚','🦜','🦢','🦩','🕊️','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐁','🐀','🐿️','🦔']
  },
  {
    label: '🍔', name: 'Food',
    emojis: ['🍎','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍅','🫒','🥥','🥝','🍆','🥑','🥦','🥬','🥒','🌶','🫑','🌽','🥕','🫛','🧄','🧅','🥔','🍠','🫘','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥮','🍢','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🧃','🥛','🍼','☕','🫖','🍵','🧋','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾']
  },
  {
    label: '⚽', name: 'Activity',
    emojis: ['⚽','🏀','🏈','⚾','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🥊','🥋','🎯','🪃','⛳','🎣','🤿','🎽','🎿','🛷','🥌','🪁','🏋️','🤸','⛹️','🤺','🏇','🏊','🧘','🚴','🤼','🤾','🏌️','🧗','🏄','🤽','🚣','🧜','🏂','🧖','🤹','🎠','🎢','🎡','🎭','🎨','🖼','🎰','🎲','🎮','🕹','🎯','🎳','🎻','🎺','🥁','🎷','🎸','🎵','🎶','🎤','🎧','📻','🎙']
  },
  {
    label: '🚗', name: 'Travel',
    emojis: ['🚗','🚕','🚙','🚌','🚎','🏎','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🏍','🛵','🛺','🚲','🛴','🛹','🛼','🚏','🛣','🏗','🚦','🚥','⚓','⛽','🚧','🚢','✈️','🛩','🚀','🛸','🚁','🛶','⛵','🚤','🛥','🛳','⛴️','🚂','🚃','🚄','🚅','🚆','🚇','🚈','🚉','🚊','🚝','🚞','🚋','🛤️','🌐','🗺','🗾','🧭','🏔','⛰','🌋','🗻','🏕','🏖','🏜','🏝','🏞','🏟','🏛','🏗','🧱','🏘','🏚','🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏨','🏩','🏪','🏫','💒','🏛','⛪','🕌','🕍','🛕','⛩','🗼','🗽','🗿','🌁','🌃','🏙','🌄','🌅','🌆','🌇','🌉','🌌','🌠']
  },
  {
    label: '💡', name: 'Objects',
    emojis: ['⌚','📱','📲','💻','⌨️','🖥','🖨','🖱','🖲','🕹','🗜','💽','💾','💿','📀','📷','📸','📹','🎥','📽','🎞','📞','☎️','📟','📠','📺','📻','🧭','⏱','⌚','⏰','🕰','⌛','⏳','📡','🔋','🔌','💡','🔦','🕯','🪔','🧯','🛢','💸','💵','💴','💶','💷','🪙','💳','💹','📈','📉','📊','📋','📅','📆','🗒','🗓','📇','🗃','🗳','🗄','🗑','🗂','📁','📂','🗂','📰','🗞','📓','📔','📒','📕','📗','📘','📙','📚','📖','🔖','🏷','💰','🪝','💼','👜','👝','🎒','🧳','👓','🕶️','🥽','🌂','☂️','☔','⛱','⚡','❄️','🔥','🌊','✂️','🗃','📌','📍','🗺','✏️','🖊','🖋','📝','📏','📐','✂️','🔍','🔎','🔏','🔐','🔒','🔓']
  },
  {
    label: '#️⃣', name: 'Symbols',
    emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💯','✅','☑️','🔘','🔲','🔳','⬜','⬛','◾','◽','◼','◻️','🔶','🔷','🔸','🔹','🔺','🔻','💠','🔘','🔲','🔳','⚫','⚪','🟤','🔴','🟠','🟡','🟢','🔵','🟣','➕','➖','✖️','➗','♾','💲','💱','™️','©️','®️','〰️','⁉️','❓','❔','❕','❗','🔅','🔆','🔱','⚜️','🔰','♻️','🔄','🔃','✔️','❎','⭕','🚫','💤','🔇','🔕','📵','🚳','🚭','🚯','🚱','🚷','🔞','📛','🔃','♀️','♂️','⚧️','🔀','🔁','🔂','▶️','⏩','⏭','⏯','◀️','⏪','⏮','🔼','⏫','🔽','⏬','⏸','⏹','⏺','🎦','🔅','🔆','📶','📳','📴','📱','🔈','🔉','🔊','📢','📣','🔔','🔕','🎵','🎶','📯']
  },
]

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState(0)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const filteredEmojis = search.trim()
    ? EMOJI_CATEGORIES.flatMap(c => c.emojis).filter(e => true) // all emojis when searching
    : EMOJI_CATEGORIES[activeCategory].emojis

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full left-0 mb-1 w-[320px] max-w-[95vw] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fade-up"
    >
      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <input
          type="text"
          placeholder="Search emoji..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#F0F2F5] rounded-lg px-3 py-2 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none"
        />
      </div>

      {/* Category Tabs */}
      {!search && (
        <div className="flex overflow-x-auto no-scrollbar border-b border-gray-100 px-2">
          {EMOJI_CATEGORIES.map((cat, i) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(i)}
              className={`shrink-0 w-9 h-9 flex items-center justify-center text-lg rounded-lg transition-colors ${
                activeCategory === i ? 'bg-[#F0F2F5]' : ''
              }`}
              title={cat.name}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="h-[200px] overflow-y-auto p-2">
        {!search && (
          <p className="text-[11px] font-semibold text-gray-400 mb-1.5 px-1 uppercase tracking-wider">
            {EMOJI_CATEGORIES[activeCategory].name}
          </p>
        )}
        <div className="grid grid-cols-8 gap-0.5">
          {filteredEmojis.map((emoji, i) => (
            <button
              key={`${emoji}-${i}`}
              onClick={() => onSelect(emoji)}
              className="w-9 h-9 flex items-center justify-center text-[22px] rounded-lg hover:bg-[#F0F2F5] active:bg-gray-200 transition-colors leading-none"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
