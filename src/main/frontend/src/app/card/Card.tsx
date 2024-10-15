import ButtonLabel from '@/components/ButtonLabel';
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion'; 

export default function Card({
  style,
  card
}: {
  card: AiCard,
  style?: string
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [hiddenCounts, setHiddenCounts] = useState({
    skills: 0,
    category: 0,
    tools: 0,
  });

  // 각 항목들의 overflow되는 갯수를 파악하기 위한 ref
  const refs = {
    skills: useRef<HTMLDivElement>(null),
    category: useRef<HTMLDivElement>(null),
    tools: useRef<HTMLDivElement>(null),
  };

  // overflow되는 항목의 수를 계산하는 함수
  const calculateHiddenCount = (type: 'skills' | 'category' | 'tools') => {
    const currentRef = refs[type].current;

    if (currentRef) {
      const items = currentRef.children;
      const containerWidth = type==='skills' ? currentRef.offsetWidth*2 : currentRef.offsetWidth; // 스킬은 2줄, 카테고리와 툴은 1줄
      let totalWidth = 0;
      let visibleCount = 0;

      for (let i = 0; i < items.length; i++) {
        totalWidth += (items[i] as HTMLElement).clientWidth;
        if (totalWidth <= containerWidth) {
          visibleCount++;
        } else {
          break; 
        }
      }

      const hiddenCount = card[type] ? card[type]?.length - visibleCount : 0;
      setHiddenCounts(prevCounts => ({
        ...prevCounts,
        [type]: hiddenCount > 0 ? hiddenCount : 0,
      }));
    }
  };

  // card의 각 항목이 변경될 때마다 실행
  useEffect(() => {
    calculateHiddenCount('skills');
    calculateHiddenCount('category');
    calculateHiddenCount('tools');

    const observer = new ResizeObserver(() => {
      calculateHiddenCount('skills');
      calculateHiddenCount('category');
      calculateHiddenCount('tools');
    });

    Object.values(refs).forEach(ref => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => {
      Object.values(refs).forEach(ref => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      });
      observer.disconnect();
    };
  }, [card.skills, card.category, card.tools]);

  // 카드 뒤집기
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className='w-[25dvw] h-[75dvh] max-h-[600px] relative'>
      <motion.div
        className='w-full h-full relative'
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }} 
        transition={{ duration: 0.7 }}
        style={{
          transformStyle: 'preserve-3d', 
          perspective: 1000 
        }}
      >
        <motion.div
          className={`absolute w-full h-full flex flex-col items-start bg-white shadow-[4px_4px_8px_rgba(0,0,0,0.3)] ${isFlipped ? 'rotate-y-180' : ''}`}
          style={{
            backfaceVisibility: 'hidden'
          }}
        >
          <div className='w-full h-1/3'>
            {card.imageUrl && (
              <img className='w-full h-full object-cover' src={card.imageUrl} alt='' />
            )}
          </div>
          <div className='h-2/3 flex flex-col justify-around'>
            <div className='flex flex-col justify-between items-start px-4'>
              {(card.fromDate || card.toDate) && (
                <div className='font-normal text-gray-cc'>{card.fromDate} ~ {card.toDate}</div>
              )}
              {card.title && (
                <div className='font-semibold text-2xl mb-4'>{card.title}</div>
              )}
              <div className='w-full flex justify-between items-center'>
                <div className='flex items-center'>
                  {card.category && card.category.length > 0 && (
                    <div ref={refs.category} className='h-[35px] flex flex-wrap overflow-hidden items-center text-sm font-semibold mb-2'>
                      {card.category.map(c => (
                        <ButtonLabel key={c} type='category' label={c} />
                      ))}
                    </div>
                  )}
                </div>
                {hiddenCounts.category > 0 && (
                  <div className='ml-2 mb-2 text-xs text-gray-500'>[+{hiddenCounts.category}]</div>
                )}
              </div>
              <div className='w-full flex justify-between items-center'>
                <div className='flex items-center'>
                  {card.skills && card.skills.length > 0 && (
                    <div ref={refs.skills} className='h-auto max-h-[70px] min-h-[35px] flex flex-wrap overflow-hidden items-center text-sm font-semibold mb-2'>
                      {card.skills.map(s => (
                        <ButtonLabel key={s.id} type='skill' label={s.name} />
                      ))}
                    </div>
                  )}
                </div>
                {hiddenCounts.skills > 0 && (
                  <div className='ml-2 text-xs text-gray-500'>[+{hiddenCounts.skills}]</div>
                )}
              </div>
              <div className='w-full flex justify-between items-center'>
                <div>
                  {card.tools && card.tools.length > 0 && (
                    <div ref={refs.tools} className='h-[35px] flex flex-wrap overflow-hidden items-center text-sm font-semibold mb-2'>
                      {card.tools.map(t => (
                        <ButtonLabel key={t.id} type='tool' label={t.name} />
                      ))}
                    </div>
                  )}
                </div>
                {hiddenCounts.tools > 0 && (
                  <div className='ml-2 text-xs text-gray-500'>[+{hiddenCounts.tools}]</div>
                )}
              </div>
            </div>
            <div className='h-1/3 flex flex-col justify-between px-4 pb-2'>
              {card.reflection && (
                <div className='line-clamp-4 text-sm mt-2 font-semibold'>
                  {card.reflection}
                </div>
              )}
              <div className='flex justify-end items-end'>
                <button
                  onClick={handleFlip}
                  className='text-xs text-primary font-bold'
                >
                  {'자세히 보기 ->'}
                </button>
              </div>
            </div>
          </div>
          
        </motion.div>
        <motion.div
          className={`absolute overflow-y-auto scrollbar w-full h-full flex flex-col justify-between items-start bg-white shadow-[4px_4px_8px_rgba(0,0,0,0.3)] ${!isFlipped ? 'rotate-y-180' : ''}`}
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <div className='w-full flex flex-col p-4'>
            <div className='w-full flex-col'>
              <div className='text-md font-bold mb-1'>역할</div>
              {card.category && (
                <div className='flex flex-wrap items-center text-sm font-semibold mb-2'>
                  {card.category.map(c => (
                    <ButtonLabel key={c} type='category' label={c} />
                  ))}
                </div>
              )}
            </div>
            <div className='w-full flex-col'>
              <div className='text-md font-bold mb-1'>언어와 스킬</div>
              {card.skills && (
                <div className='flex flex-wrap items-center text-sm font-semibold mb-2'>
                  {card.skills.map(s => (
                    <ButtonLabel key={s.id} type='skill' label={s.name} />
                  ))}
                </div>
              )}
            </div>
            <div className='w-full flex-col'>
              <div className='text-md font-bold mb-1'>개발 도구</div>
              {card.tools && (
                <div className='flex flex-wrap items-center text-sm font-semibold mb-2'>
                  {card.tools.map(t => (
                    <ButtonLabel key={t.id} type='tool' label={t.name} />
                  ))}
                </div>
              )}
            </div>
            {card.reflection && (
              <div className='w-full flex-col'>
                <div className='text-md font-bold mb-1'>경험 요약</div>
                <div className='text-sm mt-2 font-semibold'>{card.reflection}</div>
              </div>
            )}
          </div>
          
          <div className='w-full flex justify-end items-end px-4 pb-4'>
            <button
              onClick={handleFlip}
              className='text-xs text-primary font-bold'
            >
              {'간단히 보기 ->'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
